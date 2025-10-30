// Encryption worker: runs Zama relayer-sdk off the main thread
// Message in: { id:number, contractAddress:string, userAddress:string, yes:boolean }
// Message out: { id:number, ok:true, handle:string, inputProof:string } | { id:number, ok:false, error:string }

// TypeScript type declarations for Worker environment
declare function importScripts(...urls: string[]): void;

// 🚨 CRITICAL: Set up polyfills IMMEDIATELY before ANY imports
// This must be at the very top of the file
const _global = globalThis as any;

console.log('🔧 [Worker Init] 设置环境 polyfills...');
console.log('ℹ️  [Worker Init] Worker 环境检测:', {
  hasWindow: typeof _global.window !== 'undefined',
  hasSelf: typeof self !== 'undefined',
  hasNavigator: typeof navigator !== 'undefined',
  hasLocation: typeof location !== 'undefined',
  hasDocument: typeof _global.document !== 'undefined',
});

// 1. 设置 window 指向 globalThis（最重要的 polyfill）
if (!_global.window) {
  _global.window = _global;
  console.log('✅ [Worker Init] 设置 window = globalThis');
}

// 2. 设置 global 指向 globalThis
if (!_global.global) {
  _global.global = _global;
  console.log('✅ [Worker Init] 设置 global = globalThis');
}

// 3. Mock document（Worker 中没有 document）
if (!_global.document) {
  _global.document = {
    createElement: () => ({}),
    createElementNS: () => ({}),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    body: { appendChild: () => {}, removeChild: () => {} },
    head: { appendChild: () => {}, removeChild: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  console.log('✅ [Worker Init] 创建 document mock');
}

// 4. 扩展 navigator（如果需要，但不覆盖）
// Worker 中已有 navigator，我们只确保它存在需要的属性
if (typeof navigator !== 'undefined') {
  console.log('ℹ️  [Worker Init] Navigator 已存在:', navigator.userAgent);
} else {
  console.warn('⚠️  [Worker Init] Navigator 不存在（异常情况）');
}

// 5. location 也是只读的，不要覆盖
if (typeof location !== 'undefined') {
  console.log('ℹ️  [Worker Init] Location 已存在');
}

// 6. 添加 localStorage 和 sessionStorage（Worker 中没有）
if (!_global.localStorage) {
  _global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: 0,
    key: () => null,
  };
  console.log('✅ [Worker Init] 创建 localStorage mock');
}

if (!_global.sessionStorage) {
  _global.sessionStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: 0,
    key: () => null,
  };
  console.log('✅ [Worker Init] 创建 sessionStorage mock');
}

console.log('✅ [Worker Init] Polyfills 设置完成');
console.log('📊 [Worker Init] 最终环境:', {
  window: typeof _global.window,
  global: typeof _global.global,
  document: typeof _global.document,
  navigator: typeof navigator,
  location: typeof location,
});

// 🔥 使用 UMD 方式加载 SDK
console.log('📦 [Worker Init] 使用 UMD 方式加载 Zama SDK...');

// 导入 UMD 脚本
const SDK_CDN_URL = 'https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs';
console.log('📥 [Worker Init] 加载 SDK from:', SDK_CDN_URL);

// 使用 importScripts 在 Worker 中同步加载脚本
try {
  importScripts(SDK_CDN_URL);
  console.log('✅ [Worker Init] UMD SDK 加载成功');
  console.log('📊 [Worker Init] 全局 window 对象检查:', {
    hasWindow: typeof _global.window !== 'undefined',
    windowKeys: typeof _global.window === 'object' ? Object.keys(_global.window).slice(0, 20) : [],
  });
} catch (scriptError: any) {
  console.error('❌ [Worker Init] 加载 UMD SDK 失败:', scriptError);
}

let ready = false;
let instance: any = null;

async function ensureReady() {
  if (!ready) {
    console.log('🔧 [Worker] 开始初始化 Zama SDK...');
    const startTime = Date.now();
    
    try {
      // 从 window 对象获取 SDK（UMD 会注入到 window）
      console.log('🔍 [Worker] 查找 SDK 在 window 对象中...');
      
      // UMD 可能注入到不同的位置，尝试多种可能性
      const possiblePaths = [
        'RelayerSDK',
        'ZamaRelayerSDK', 
        'relayerSDK',
        'fhevm',
        'zamaFhe',
      ];
      
      let SDK: any = null;
      for (const path of possiblePaths) {
        if (_global.window && _global.window[path]) {
          console.log(`✅ [Worker] 找到 SDK at window.${path}`);
          SDK = _global.window[path];
          break;
        }
      }
      
      if (!SDK) {
        console.error('❌ [Worker] 未在 window 对象中找到 SDK');
        console.log('📊 [Worker] window 对象的键:', Object.keys(_global.window || {}));
        throw new Error('UMD SDK 未正确加载到 window 对象');
      }
      
      console.log('📊 [Worker] SDK 对象内容:', Object.keys(SDK));
      
      const { initSDK, createInstance, SepoliaConfig } = SDK;
      
      if (!initSDK || !createInstance || !SepoliaConfig) {
        console.error('❌ [Worker] SDK 导出缺失:', {
          hasInitSDK: !!initSDK,
          hasCreateInstance: !!createInstance,
          hasSepoliaConfig: !!SepoliaConfig,
          SDKKeys: Object.keys(SDK),
        });
        throw new Error('SDK 导出不完整');
      }
      
      console.log('📦 [Worker] 步骤 1/2: 调用 initSDK()...');
      await initSDK();
      console.log('✅ [Worker] initSDK() 完成，耗时:', Date.now() - startTime, 'ms');
      
      console.log('🔐 [Worker] 步骤 2/2: 创建 FHE 实例 (SepoliaConfig)...');
      const instanceStart = Date.now();
      instance = await createInstance(SepoliaConfig);
      console.log('✅ [Worker] FHE 实例创建完成，耗时:', Date.now() - instanceStart, 'ms');
      
      ready = true;
      console.log('🎉 [Worker] SDK 初始化完成！总耗时:', Date.now() - startTime, 'ms');
      console.log('📊 [Worker] Instance:', instance);
    } catch (error) {
      console.error('❌ [Worker] SDK 初始化失败:', error);
      console.error('错误详情:', error);
      throw error;
    }
  } else {
    console.log('✓ [Worker] SDK 已就绪，跳过初始化');
  }
}

self.onmessage = async (ev: MessageEvent) => {
  const data = ev.data || {};
  
  if (data.type === 'init') {
    console.log('📨 [Worker] 收到初始化请求');
    try {
      await ensureReady();
      console.log('✅ [Worker] 向主线程发送就绪消息');
      (self as any).postMessage({ type: 'ready' });
    } catch (e: any) {
      console.error('❌ [Worker] 初始化失败:', e);
      (self as any).postMessage({ type: 'error', error: e?.message || String(e) });
    }
    return;
  }

  if (data.type === 'encrypt') {
    const { id, contractAddress, userAddress, yes } = data;
    console.log(`🔒 [Worker] 收到加密请求 #${id}:`, { contractAddress, userAddress, yes });
    
    try {
      await ensureReady();
      
      console.log(`🔨 [Worker] 创建加密输入缓冲区 #${id}...`);
      const buffer = instance.createEncryptedInput(contractAddress, userAddress);
      
      console.log(`📝 [Worker] 添加布尔值到缓冲区 #${id}:`, yes);
      buffer.addBool(!!yes);
      
      console.log(`⚡ [Worker] 开始加密 #${id}...`);
      const encryptStart = Date.now();
      const encrypted = await buffer.encrypt();
      console.log(`✅ [Worker] 加密完成 #${id}，耗时:`, Date.now() - encryptStart, 'ms');
      console.log(`📤 [Worker] 加密结果 #${id}:`, { 
        handle: encrypted.handles[0], 
        proofLength: encrypted.inputProof.length 
      });
      
      (self as any).postMessage({ 
        id, 
        ok: true, 
        handle: encrypted.handles[0], 
        inputProof: encrypted.inputProof 
      });
    } catch (e: any) {
      console.error(`❌ [Worker] 加密失败 #${id}:`, e);
      (self as any).postMessage({ id, ok: false, error: e?.message || String(e) });
    }
  }
};

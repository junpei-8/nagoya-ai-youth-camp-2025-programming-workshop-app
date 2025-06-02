// 1. このファイルを secret.js にコピーしてください。
// 2. "YOUR_DUMMY_API_KEY_HERE" の部分を、あなたの実際のOpenAI APIキーに置き換えてください。
// 3. 各マップの index.html ファイルで、<!-- <script src="../secret.js"></script> --> のコメントを解除して、
//    このファイルが読み込まれるようにしてください。

const OPENAI_API_KEY = 'YOUR_DUMMY_API_KEY_HERE';

// APIキーをグローバルスコープに設定します。
// これにより、他のスクリプト (例: core.js) から window.OPENAI_API_KEY としてアクセスできます。
window.OPENAI_API_KEY = OPENAI_API_KEY;

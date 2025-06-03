// ai-fetch.js
// OpenAI APIキーは、このモジュールを使用する側 (例: index.html 内のスクリプト) から渡されるようになったため、
// ここでの直接的な secret.js からのインポートは不要になりました。

/**
 * OpenAI APIを使用して経路パスを取得します。
 * @param {object} params - AIパス取得のためのパラメータ。
 * @param {string} params.systemPrompt - AIへのシステムプロンプト。
 * @param {string} params.routePrompt - ユーザー提供の経路プロンプト（指示）。
 * @param {object} [params.mapConfig] - オプション。AIがコンテキストとして必要とする場合のマップ設定（現在のプロンプトでは明示的に使用していません）。
 * @param {string} params.apiKey - OpenAI APIキー。
 * @returns {Promise<Array<string>|null>} 移動指示の配列（例: ['↑', '↓', '←', '→']）を解決するPromise、またはエラーの場合はnull。
 */
export async function fetchRoutePathWithOpenAI({ systemPrompt, routePrompt, mapConfig, apiKey }) {
    // APIキーは関数の引数から取得するようになりました。
    // const apiKey = OPENAI_API_KEY; // この行は不要になりました。

    if (!apiKey || apiKey === "YOUR_OPENAI_API_KEY_HERE" || apiKey === "YOUR_DUMMY_API_KEY_HERE") {
        console.error("OpenAI APIキーが設定されていないか、プレースホルダーのままです。適切なAPIキーを渡してください。");
        alert("OpenAI APIキーが正しく設定されていません。");
        return null;
    }

    const openAIEndpoint = "https://api.openai.com/v1/chat/completions";

    // OpenAI APIのためのメッセージペイロードを構築
    const messages = [
        {
            role: "system",
            content: systemPrompt
        },
        {
            role: "user",
            content: routePrompt
        }
    ];

    // AIにマップを「見せたい」場合は、ユーザープロンプトにmapConfigを追加します。
    // 現状、プロンプトはAIがユーザーのroutePromptによるナビゲーションヒントに依存するように設計されています。
    // もし含めるなら、次のようになるでしょう:
    // if (mapConfig && mapConfig.layout) { // mapConfig.layoutが存在することも確認
    //     const userMessage = messages.find(m => m.role === 'user');
    //     if (userMessage) {
    //         userMessage.content += "\n\nマップレイアウト:\n" + JSON.stringify(mapConfig.layout);
    //     }
    // }


    try {
        const response = await fetch(openAIEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}` // パラメータから渡されたapiKeyを使用
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo", // または、希望するモデル
                messages: messages,
                // 必要であれば、temperatureやmax_tokensのような他のパラメータを追加
                // temperature: 0.7,
                // max_tokens: 100,
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null); // エラー解析を試みるが、解析失敗で落ちないようにする
            console.error("OpenAI APIエラー:", response.status, response.statusText, errorData);
            alert(`OpenAI APIエラーが発生しました: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();

        if (data.choices && data.choices.length > 0) {
            const messageContent = data.choices[0].message.content;
            // AIが移動指示を単純なコンマ区切り文字列などで返すと仮定。
            // この部分は実際のAIの出力形式に基づいて堅牢にする必要があります。
            // 例: "↑,→,↓" または "上に移動, 右に曲がる, 下に移動"
            // 現状では、矢印文字のシーケンスであると仮定します。
            // ここではより堅牢なパーサーが必要になるかもしれません。
            const moves = messageContent.match(/[↑↓←→]+/g);
            if (moves) {
                return moves;
            } else {
                console.warn("AIの応答に認識可能な移動指示が含まれていませんでした:", messageContent);
                alert("AIの応答から有効な移動指示を抽出できませんでした。");
                return null;
            }
        } else {
            console.warn("OpenAI APIの応答に選択肢が含まれていませんでした:", data);
            alert("AIからの応答に選択肢が含まれていませんでした。");
            return null;
        }

    } catch (error) {
        console.error("OpenAIからの経路取得中にエラーが発生しました:", error);
        alert("OpenAIからの経路取得中にエラーが発生しました。");
        return null;
    }
}

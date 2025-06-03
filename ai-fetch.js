// ai-fetch.js
// OpenAI APIキーは、このモジュールを使用する側 (例: index.html 内のスクリプト) から渡されるように変更されました。
// そのため、ここでの secret.js からの直接的なインポートは不要です。

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
    // APIキーは関数の引数から取得します。
    // const apiKey = OPENAI_API_KEY; // この行は不要になりました。

    if (!apiKey || apiKey === "YOUR_OPENAI_API_KEY_HERE" || apiKey === "YOUR_DUMMY_API_KEY_HERE") {
        console.error("OpenAI APIキーが設定されていないか、プレースホルダーのままです。適切なAPIキーを渡してください。");
        alert("OpenAI APIキーが正しく設定されていません。");
        return null;
    }

    const openAIEndpoint = "https://api.openai.com/v1/chat/completions";

    // OpenAI APIのためのメッセージペイロードを構築します。
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

    // AIにマップ情報を渡したい場合は、ユーザープロンプトにmapConfigの内容を追加できます。
    // 現在のプロンプト設計では、AIはユーザーからの経路指示に依存しています。
    // もしマップ情報を含める場合の例:
    // if (mapConfig && mapConfig.layout) { // mapConfig.layoutの存在も確認します。
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
                "Authorization": `Bearer ${apiKey}` // パラメータとして渡されたapiKeyを使用します。
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo", // または、使用したいモデルを指定します。
                messages: messages,
                // 必要に応じて、temperatureやmax_tokensなどの他のパラメータを追加します。
                // temperature: 0.7,
                // max_tokens: 100,
            })
        });

        if (!response.ok) {
            // エラーレスポンスのJSON解析を試みます。失敗した場合はデフォルトのエラーメッセージを使用します。
            const errorData = await response.json().catch(() => ({ message: "レスポンスJSONの解析に失敗しました。" }));
            console.error("OpenAI APIエラー:", response.status, response.statusText, errorData);
            alert(`OpenAI APIエラーが発生しました: ${response.status} ${response.statusText}${errorData && errorData.message ? ` - ${errorData.message}` : ''}`);
            return null;
        }

        const data = await response.json();

        // APIからの応答にchoicesが含まれているか、またその配列が空でないかを確認します。
        if (!data.choices || data.choices.length === 0) {
            console.warn("OpenAI APIの応答に選択肢 (choices) が含まれていませんでした:", data);
            alert("AIからの応答に選択肢が含まれていませんでした。");
            return null;
        }

        const messageContent = data.choices[0].message.content;
        // AIからの応答メッセージ（移動指示）を解析します。
        // この部分は、AIの応答形式に応じて調整が必要になる場合があります。
        // 例えば、"↑,→,↓" や "上, 右, 下" のような形式を想定しています。
        // 現在は、連続した矢印文字（↑↓←→）を抽出します。
        const moves = messageContent.match(/[↑↓←→]+/g);

        // 抽出された移動指示が有効か確認します。
        if (!moves || moves.length === 0) {
            console.warn("AIの応答に認識可能な移動指示が含まれていませんでした:", messageContent);
            alert("AIの応答から有効な移動指示を抽出できませんでした。");
            return null;
        }

        return moves; // 抽出された移動指示の配列を返します。

    } catch (error) {
        // ネットワークエラーやその他の予期せぬエラーをキャッチします。
        console.error("OpenAIからの経路取得中に予期せぬエラーが発生しました:", error);
        alert("OpenAIからの経路取得中に予期せぬエラーが発生しました。詳細はコンソールを確認してください。");
        return null;
    }
}

const { app } = require('@azure/functions');

// https://learn.microsoft.com/en-us/azure/ai-services/translator/quickstart-text-rest-api?tabs=nodejs
const axios = require('axios').default;
const { v4: uuidv4 } = require('uuid');
let key = "<your-translator-key>";
let endpoint = "https://api.cognitive.microsofttranslator.com";
let location = "<YOUR-RESOURCE-LOCATION>"; // like "eastus" //

async function translateText(fromLanguage, toLanguage, textToTranslate) {
    try {
        const response = await axios({
            baseURL: endpoint,
            url: '/translate',
            method: 'post',
            headers: {
                'Ocp-Apim-Subscription-Key': key,
                'Ocp-Apim-Subscription-Region': location,
                'Content-type': 'application/json',
                'X-ClientTraceId': uuidv4().toString()
            },
            params: {
                'api-version': '3.0',
                'from': fromLanguage,
                'to': toLanguage
            },
            data: [{
                'text': textToTranslate
            }],
            responseType: 'json'
        });

        // Extract the translated text
        const translatedText = response.data[0]?.translations[0]?.text || 'Translation not available';
        return translatedText;
    } catch (error) {
        throw new Error(`Error during translation: ${error.message}`);
    }
}

app.http('callTranslatorJS', {
    methods: ['GET', 'POST'],
    authLevel: 'function',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        // Extract the 'name' query parameter or use 'world' as default
        const fromLang = request.query.get('fromLanguage')  || 'en'; // Replace with the source language code
        const toLang = request.query.get('toLanguage')  || 'es'; // Replace with the target language code(s) #es, fr
        const text = request.query.get('textToTranslate')  || 'Hello World! I\'m a functional Azure Function calling Azure Translator'; //'I would really like to drive your car around the block a few times!';

        try {
            // Get the translated text
            const translatedText = await translateText(fromLang, toLang, text);

            // Log the translated response
            context.log(`Translated text: ${translatedText}`);

            // Return a custom response with translated text
            return {
                body: `Translated text: ${translatedText}`,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
        } catch (error) {
            // Handle translation errors
            context.log(error.message);
            return { status: 500, body: 'Translation failed.' };
        }
    }
});
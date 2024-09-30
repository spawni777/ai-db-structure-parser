import { OpenAI } from 'openai';
import type { ClientOptions } from 'openai';

const configuration: ClientOptions = {
    apiKey: process.env.OPENAI_API_KEY, // Load API key from environment variables
};

export const openai = new OpenAI(configuration);

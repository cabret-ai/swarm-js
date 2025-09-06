/**
 * Evaluation utilities for LLM-based testing
 * JavaScript port of Python evals_util.py
 */

const OpenAI = require('openai');

const client = new OpenAI();

/**
 * Evaluate a boolean condition using an LLM
 * @param {string} instruction - The evaluation instruction
 * @param {string} data - The data to evaluate
 * @returns {Promise<{value: boolean, reason: string}>} Evaluation result
 */
async function evaluateWithLLMBool(instruction, data) {
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: instruction + '\n\nRespond with a JSON object containing "value" (boolean) and optional "reason" (string).' },
        { role: 'user', content: data }
      ],
      response_format: { type: 'json_object' },
      temperature: 0
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(content);
    
    return {
      value: Boolean(result.value),
      reason: result.reason || null
    };
  } catch (error) {
    console.error('Error in LLM evaluation:', error);
    throw error;
  }
}

module.exports = {
  evaluateWithLLMBool
};
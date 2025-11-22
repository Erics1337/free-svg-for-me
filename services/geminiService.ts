/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Stream the SVG generation from the API.
 * This uses the native Fetch API and ReadableStream to yield chunks as they arrive.
 * 
 * @param prompt The user's description
 * @param model The selected model (e.g. gemini-2.0-flash)
 * @param animate Whether to animate the SVG
 * @param transparent Whether to make the background transparent
 * @param onChunk Callback function that receives the accumulated text as chunks arrive
 * @returns The final complete SVG string
 */
export const streamSvgGeneration = async (
  prompt: string,
  model: string,
  animate: boolean,
  transparent: boolean,
  onChunk: (partialContent: string) => void
): Promise<string> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt, 
        model,
        animate,
        transparent
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to generate SVG";
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) errorMessage = errorJson.error;
      } catch (e) {
        // fallback to text or status text
        errorMessage = errorText || response.statusText;
      }
      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error("Response body is empty");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedContent = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      accumulatedContent += chunk;
      onChunk(accumulatedContent);
    }

    return accumulatedContent;

  } catch (error: any) {
    console.error("Generation Stream Error:", error);
    throw new Error(error.message || "Failed to generate SVG.");
  }
};

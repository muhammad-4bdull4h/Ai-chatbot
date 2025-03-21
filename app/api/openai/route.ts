import OpenAI from "openai";
import { NextResponse } from "next/server";
import { Client } from "@gradio/client";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.Open_Router,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    "X-Title": "AI Content Generator",
  },
});

export async function POST(req: Request) {
  try {
    const { prompt, mode } = await req.json();

    if (mode === "text") {
      const completion = await openai.chat.completions.create({
        model: "deepseek/deepseek-r1-zero:free",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      // console.log("Prompt", prompt);

      // console.log("Result", completion.choices[0].message);

      if (!completion.choices[0].message) {
        return NextResponse.json(
          { error: "Invalid response from API" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        result: completion.choices[0].message,
      });
    } else {
      const client = await Client.connect("black-forest-labs/FLUX.1-dev", {
        hf_token: process.env.HF_TOKEN as `hf_${string}`,
      });
      const result = await client.predict("/infer", {
        prompt: prompt,
        seed: 0,
        randomize_seed: true,
        width: 512,
        height: 512,
        guidance_scale: 7.5,
        num_inference_steps: 50,
      });

      const imageUrl = (result.data as any[])[0].url;

      if (!imageUrl) {
        return NextResponse.json(
          { error: "Invalid response from API" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        result: {
          content: imageUrl,
          reasoning: null,
        },
      });
    }
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process the request" },
      { status: 500 }
    );
  }
}

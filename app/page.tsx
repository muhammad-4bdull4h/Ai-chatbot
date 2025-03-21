"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  ImageIcon,
  MessageSquare,
  Loader2,
  Sparkles,
  ChevronDown,
  Copy,
  ChevronUp,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "katex/dist/katex.min.css";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<
    { res: string; prompt: string; mode: "text" | "image" }[] | []
  >([]);
  const [reasoning, setReasoning] = useState<string | null>(null);
  const [mode, setMode] = useState<"text" | "image">("text");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) {
      setError("Please enter a prompt");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(result);
    setReasoning(null);

    try {
      const response = await fetch("/api/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, mode }),
      });

      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult([{ prompt, mode, res: data.result.content }, ...result]);
        setReasoning(data.result.reasoning);
        setPrompt("");
      }
    } catch (error) {
      setError("Failed to generate content. Please try again.");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderResult = (text: string) => {
    // Remove \boxed{} while preserving its content
    const cleanedText = text.replace(/\\boxed{([\s\S]*?)}/g, "$1");

    // Detect if the text starts with ```text\n and ends with ```
    const textBlockMatch = cleanedText.match(/^```text\n([\s\S]*?)```$/);

    if (textBlockMatch) {
      // Render the content inside the text block as plain text
      return <div className="whitespace-pre-wrap">{textBlockMatch[1]}</div>;
    }

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const codeText = String(children).replace(/\n$/, "");

            return !inline && match ? (
              <div className="relative group">
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {codeText}
                </SyntaxHighlighter>
                <button
                  className="absolute flex top-2 right-2 p-1 text-sm rounded bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 group-hover:visible"
                  onClick={() => {
                    navigator.clipboard.writeText(codeText);
                    toast("Copied to clipboard!");
                  }}
                >
                  <Copy className="h-4 w-4" /> Copy
                </button>
              </div>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {cleanedText}
      </ReactMarkdown>
    );
  };

  const renderImages = (res: string) => {
    return (
      <div>
        <a target="_blank" rel="noopener noreferrer" href={res}>
          <Image
            className=""
            src={res}
            alt="Generated Image"
            width={300}
            height={300}
          />
        </a>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/10 dark:from-background dark:via-primary/10 dark:to-accent/20">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
              Oolympic Coder
            </h1>
          </div>
          <ThemeToggle />
        </div>
        <Card className="border-border/40 shadow-2xl backdrop-blur-sm bg-background/60">
          <Tabs
            defaultValue="text"
            className="w-full"
            onValueChange={(value) => {
              setMode(value as "text" | "image");
              setError(null);
            }}
          >
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 p-1">
              <TabsTrigger
                value="text"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
              >
                <MessageSquare className="w-4 h-4" />
                Olympic Coder (Better than you)
              </TabsTrigger>
              <TabsTrigger
                value="image"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
              >
                <ImageIcon className="w-4 h-4" />
                Image Generation
              </TabsTrigger>
            </TabsList>
            {reasoning && (
              <div className="mt-8 ml-7">
                <p
                  className="flex gap-2 text-[#24db67] cursor-pointer"
                  onClick={() => setShowReasoning(!showReasoning)}
                >
                  Reasoning{" "}
                  {showReasoning ? (
                    <ChevronDown className="w-4 h-4 mt-1" />
                  ) : (
                    <ChevronUp className="w-4 h-4  mt-1" />
                  )}
                </p>
                {showReasoning && (
                  <div
                    className={`prose ml-2 prose-sm dark:prose-invert max-w-none transition-all duration-500 ${
                      showReasoning
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 -translate-y-2"
                    }`}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {reasoning}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            )}
            <div className="p-8 mt-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-3 flex-col sm:flex-row">
                  <Input
                    placeholder={
                      mode === "text"
                        ? "Enter your prompt for Olympic Coder..."
                        : "Image generation prompt..."
                    }
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex-1 bg-background/40 backdrop-blur-sm border-primary/20 focus:border-primary/50 transition-all duration-300"
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/25 transition-all duration-300"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Generate"
                    )}
                  </Button>
                </div>
              </form>
              {error && (
                <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">
                  {error}
                </div>
              )}
              <div className="mt-6">
                {result.length > 0 &&
                  result.map((obj, i) => (
                    <div className="mt-5 mb-10" key={i}>
                      <div className="flex justify-end mb-3">
                        <div className="dark:bg-[#303030] bg-[#e0dfdf] rounded-full p-2 inline-flex">
                          <div>{obj.prompt}</div>
                        </div>
                      </div>
                      {obj.mode === "text"
                        ? renderResult(obj.res)
                        : renderImages(obj.res)}
                    </div>
                  ))}
              </div>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

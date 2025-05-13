
"use client";

import { ArrowUp, Loader2, Plus, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";

const formSchema = z.object({
  message: z.string().min(1, { message: "Message cannot be empty" })
});

type FormValues = z.infer<typeof formSchema>;

type InputBoxProps = {
  id: string;
  onSendMessage: (message: string) => Promise<void>;
  greeting?: string;
  hasMessages: boolean;
}

export default function InputBox({  onSendMessage, greeting, hasMessages }: InputBoxProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSecretKeyInput, setShowSecretKeyInput] = useState(false);
  const [secretKey, setSecretKey] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" }
  });

  useEffect(() => {
    // Load secret key from localStorage on component mount
    const savedKey = localStorage.getItem('secretKey');
    if (savedKey) {
      setSecretKey(savedKey);
    }
  }, []);

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (secretKey.trim()) {
      localStorage.setItem('secretKey', secretKey);
      // Force a page reload to update the greeting
      window.location.reload();
    }
    setShowSecretKeyInput(false);
  };

  const onSubmit = async (values: FormValues) => {
    if (!values.message.trim() || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      await onSendMessage(values.message);
      form.reset();
    } catch (error) {
      console.error('Error submitting message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Position classes change based on whether there are messages
  const containerPositionClass = hasMessages
    ? "fixed bottom-0 left-0 right-0 pb-4 z-50"
    : "fixed inset-0 flex items-center justify-center pointer-events-none z-50";

  return (
    <div className={containerPositionClass}>
      <div className={`w-full max-w-[800px] mx-auto px-4 pointer-events-auto ${hasMessages ? "" : "flex flex-col items-center"}`}>
        {greeting && !hasMessages && (
          <h1 className="text-2xl font-medium text-white mb-5 text-center">
            {greeting}
          </h1>
        )}
        <div className="w-full">
          <div className="border border-[#004366] bg-[#00273E] rounded-xl p-3 shadow-md hover:shadow-lg focus-within:border-[#FF9800] transition-all w-full ring-1 ring-[#00273E]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="relative">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <TextareaAutosize
                        {...field}
                        autoFocus
                        disabled={isSubmitting}
                        minRows={1}
                        maxRows={6}
                            placeholder="How can I help you today?"
                            className="w-full bg-transparent resize-none text-white text-base py-2 px-1 outline-none border-none disabled:opacity-50"
                        onKeyDown={(event : any) => {
                          if (event.key === "Enter" && !event.shiftKey && !isSubmitting) {
                            event.preventDefault();
                            form.handleSubmit(onSubmit)();
                          }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex gap-1">
                      {showSecretKeyInput ? (
                        <form onSubmit={handleKeySubmit} className="flex items-center">
                          <input
                            type="text"
                            value={secretKey}
                            onChange={(e) => setSecretKey(e.target.value)}
                            placeholder="Enter your name"
                            className="bg-[#003152] border border-[#004366] text-white text-sm rounded-lg px-3 py-1.5 mr-2 focus:ring-1 focus:ring-[#FF9800] outline-none"
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="text-white bg-gradient-to-r from-[#FF9800] to-[#FF5722] hover:from-[#FF8800] hover:to-[#FF4500] focus:outline-none font-medium rounded-lg text-xs px-3 py-1.5 mr-1 shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowSecretKeyInput(false)}
                            className="p-1 text-white hover:text-[#FF9800] rounded-full transition-colors"
                          >
                            <X size={18} />
                          </button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowSecretKeyInput(true)}
                          className="h-8 w-8 bg-gradient-to-br from-[#003152] to-[#004366] border border-[#005C80] rounded-md flex items-center justify-center text-white hover:text-[#FF9800] hover:border-[#FF9800] transition-all hover:shadow-sm"
                        >
                          <span className="sr-only">Change name</span>
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center">
                <button
                  type="submit"
                        className="h-8 w-8 bg-gradient-to-br from-[#FF9800] to-[#FF5722] text-white hover:from-[#FF8800] hover:to-[#FF4500] cursor-pointer rounded-md transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  disabled={!form.formState.isValid || isSubmitting}
                >
                  {isSubmitting ? (
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                          <ArrowUp className="w-4 h-4 text-white" />
                  )}
                </button>
                    </div>
              </div>
            </div>
          </form>
        </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
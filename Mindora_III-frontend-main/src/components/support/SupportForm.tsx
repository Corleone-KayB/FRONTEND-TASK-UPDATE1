"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORT_CONTACT } from "@/lib/mock-data/public";

const TOPICS = [
  { value: "account", label: "Account or login help" },
  { value: "booking", label: "Booking or sessions" },
  { value: "billing", label: "Billing or payments" },
  { value: "technical", label: "Technical issue" },
  { value: "partnership", label: "Partnership or business" },
  { value: "other", label: "Something else" },
] as const;

type TopicValue = (typeof TOPICS)[number]["value"];

function resolveTopic(value?: string): TopicValue {
  return TOPICS.some((topic) => topic.value === value) ? (value as TopicValue) : TOPICS[0].value;
}

export function SupportForm({ initialTopic }: { initialTopic?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(resolveTopic(initialTopic));
  const [message, setMessage] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const topicLabel = TOPICS.find((item) => item.value === topic)?.label ?? topic;
    const subject = encodeURIComponent(`Mindora support: ${topicLabel}`);
    const body = encodeURIComponent(
      [`Name: ${name}`, `Email: ${email}`, `Topic: ${topicLabel}`, "", message].join("\n")
    );
    window.location.href = `${SUPPORT_CONTACT.emailHref}?subject=${subject}&body=${body}`;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="support-name" className="text-sm font-medium text-[#1A1A1A]">
            Name
          </label>
          <Input
            id="support-name"
            name="name"
            required
            autoComplete="name"
            placeholder="Your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="support-email" className="text-sm font-medium text-[#1A1A1A]">
            Email
          </label>
          <Input
            id="support-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="support-topic" className="text-sm font-medium text-[#1A1A1A]">
          What do you need help with?
        </label>
        <select
          id="support-topic"
          name="topic"
          value={topic}
          onChange={(event) => setTopic(resolveTopic(event.target.value))}
          className="flex h-12 w-full rounded-xl border border-border bg-white px-4 text-sm text-foreground focus-visible:border-mindora-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mindora-purple/30"
        >
          {TOPICS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="support-message" className="text-sm font-medium text-[#1A1A1A]">
          Message
        </label>
        <Textarea
          id="support-message"
          name="message"
          required
          rows={5}
          placeholder="Tell us what happened, and how we can help."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="min-h-[140px] rounded-xl border-border px-4 py-3 focus-visible:border-mindora-purple focus-visible:ring-mindora-purple/30"
        />
      </div>

      <Button type="submit" size="lg" className="h-12 w-full rounded-xl sm:w-auto sm:px-8">
        Email support
        <ArrowRight className="h-4 w-4" />
      </Button>
      <p className="text-xs leading-relaxed text-[#6B7280]">
        Opens your email app with a message to {SUPPORT_CONTACT.email}. For urgent danger, use local
        emergency services or the crisis line in the Mindora app.
      </p>
    </form>
  );
}

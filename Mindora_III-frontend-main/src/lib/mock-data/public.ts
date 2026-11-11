import type { LucideIcon } from "lucide-react";
import {
  Annoyed,
  CalendarCheck,
  ClipboardList,
  Frown,
  LayoutGrid,
  Meh,
  RotateCw,
  Syringe,
  Users,
  UtensilsCrossed,
  Video,
} from "lucide-react";

export const HERO_TYPE_CARDS = [
  {
    id: "individual",
    title: "Individual",
    subtitle: "For myself",
    href: "/get-matched",
    className: "bg-[#7C3AED]",
  },
  {
    id: "couples",
    title: "Couples",
    subtitle: "For me and my partner",
    href: "/get-matched",
    className: "bg-[#0F766E]",
  },
  {
    id: "teen",
    title: "Teen",
    subtitle: "For my child",
    href: "/get-matched",
    className: "bg-[#D97706]",
  },
] as const;

export const SPECIALITIES: { label: string; icon: LucideIcon }[] = [
  { label: "Depression", icon: Frown },
  { label: "Mood disorder", icon: Meh },
  { label: "Anxiety disorder", icon: Annoyed },
  { label: "OCD", icon: RotateCw },
  { label: "Addiction", icon: Syringe },
  { label: "Eating disorder", icon: UtensilsCrossed },
  { label: "Couple therapy", icon: Users },
  { label: "Others", icon: LayoutGrid },
];

export const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Tell us what you need",
    description: "Answer a few gentle questions, or browse therapists and choose someone yourself.",
    icon: ClipboardList,
    image: "/images/landing/how-it-works-1.png",
  },
  {
    step: "2",
    title: "Book a time that fits",
    description:
      "Pick a slot that works for you. Video, audio, or chat — you decide how to connect.",
    icon: CalendarCheck,
    image: "/images/landing/how-it-works-2.png",
  },
  {
    step: "3",
    title: "Start the conversation",
    description: "Meet privately by camera, microphone, or messages — from wherever you feel safe.",
    icon: Video,
    image: "/images/landing/how-it-works-3.png",
  },
] as const;

export const TRUST_STATS = ["10,000+ Patients", "200+ Therapists", "50,000+ Sessions"] as const;

export const MATCH_REASONS = [
  { id: "depression", label: "Depression / Sadness / Low mood" },
  { id: "anxiety", label: "Anxiety / Social anxiety / Panic / OCD tendencies" },
  { id: "anger", label: "Anger issues" },
  { id: "relationships", label: "General relationship conflicts (family, friends, workplace)" },
  { id: "parenting", label: "Parenting difficulties" },
  { id: "growth", label: "Personal growth" },
  { id: "addiction", label: "Substance use / Addiction" },
  { id: "couple", label: "Couple problems" },
  { id: "sleep", label: "Sleep problems" },
  { id: "trauma", label: "Trauma / PTSD" },
  { id: "burnout", label: "Work stress / Burnout" },
  { id: "self", label: "Self-discovery" },
  { id: "child", label: "Child / Adolescent difficulties" },
  { id: "eating", label: "Eating problems / Eating disorders" },
] as const;

export const PUBLIC_NAV_LINKS = [
  { href: "/therapists", label: "Therapists" },
  { href: "/tests", label: "Tests" },
  { href: "/get-matched", label: "Find a Therapist" },
  { href: "/business", label: "Business" },
  { href: "/support", label: "Support" },
] as const;

export const FOOTER_LINKS = [
  { href: "/therapists", label: "Therapists" },
  { href: "/tests", label: "Tests" },
  { href: "/get-matched", label: "Find a Therapist" },
  { href: "/business", label: "Business" },
  { href: "/about", label: "About" },
  { href: "/support", label: "Support" },
] as const;

export const SUPPORT_CONTACT = {
  phoneDisplay: "+250 783 974-066",
  phoneHref: "tel:+250783974066",
  phoneHours: "Monday to Friday, 9am to 5pm",
  email: "info@mindora.rw",
  emailHref: "mailto:info@mindora.rw",
  emailNote: "We'll respond within 24 hours",
} as const;

export const BUSINESS_SEGMENTS = [
  {
    id: "schools",
    title: "Schools & Universities",
    summary:
      "Students get a private chatbot, mood tracking, and the Inshuti Mindora board game to help them talk about mental health without needing a counselor there.",
    image: "/images/business/university.png",
    imageAlt: "Students outside a high school campus",
    points: [
      "Private chatbot and mood tracking for students",
      "Inshuti Mindora board game for facilitated conversations",
      "Teacher and student-leader training to spot when help is needed",
      "Year-round support in Kinyarwanda and English",
    ],
  },
  {
    id: "businesses",
    title: "Businesses",
    summary:
      "We help companies support staff mental health without setting up a whole program themselves.",
    image: "/images/business/business.png",
    imageAlt: "Partners shaking hands over a business agreement",
    points: [
      "Staff get the Mindora app and screening tools",
      "A few training days a year for your team",
      "Lower cost per person as your staff size grows",
      "No need to build an in-house mental health program",
    ],
  },
  {
    id: "ngos",
    title: "For NGOs & Youth Centers",
    summary:
      "Mindora Health gives outreach teams a low-cost way to run structured mental health sessions, even without clinical staff on hand.",
    image: "/images/business/ngo-youth.png",
    imageAlt: "Young people gathering at a community youth center",
    points: [
      "Board game sessions that non-clinical facilitators can lead",
      "Structured group conversations with no psychology background required",
      "Automatic flagging and referral when someone needs professional care",
      "Built for outreach budgets and community settings",
    ],
  },
] as const;

export const BUSINESS_WHY = [
  "Built for Rwanda — designed around local language, culture, and access",
  "App, training, and board game work in Kinyarwanda and English",
  "Distress is flagged and passed on to real professional help",
  "Accessible tools that work with or without clinical staff on site",
] as const;

import Image from "next/image";

/** Doctor portrait for the home hero - bottom-aligned, scaled for Figma. */
export function HomeHeroPortrait() {
  return (
    <div className="relative h-full w-full">
      <Image
        src="/images/doctor-image.png"
        alt="A friendly therapist holding a clipboard, ready to help"
        fill
        className="scale-[1.0] object-contain object-bottom object-center"
        priority
        sizes="(max-width: 1024px) 90vw, 60vw"
      />
    </div>
  );
}

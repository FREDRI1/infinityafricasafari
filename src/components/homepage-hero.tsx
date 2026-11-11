"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SafariSearch } from "@/components/safari-search";
import type { HeroConfigContent } from "@/lib/hero-config";

const fallbackImage = "/assets/images/hero/savannah-dawn.jpg";
const slideInterval = 4500;
const fadeDuration = 1500;

type HomepageHeroProps = {
  config: HeroConfigContent;
  imageUrls: string[];
  destinations: { name: string; slug: string }[];
};

export function HomepageHero({
  config,
  imageUrls,
  destinations,
}: HomepageHeroProps) {
  const heroRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;
    const image = hero?.querySelector<HTMLElement>(".hero-image-parallax");
    if (!hero || !image || config.mode !== "SINGLE_IMAGE") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const updateParallax = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const offset = Math.min(18, Math.max(-18, (window.scrollY - hero.offsetTop) * 0.06));
        image.style.setProperty("--hero-parallax-offset", `${offset}px`);
      });
    };
    updateParallax();
    window.addEventListener("scroll", updateParallax, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateParallax);
    };
  }, [config.mode]);

  useEffect(() => {
    if (previousIndex === null) return;
    const timer = window.setTimeout(() => setPreviousIndex(null), fadeDuration);
    return () => window.clearTimeout(timer);
  }, [previousIndex]);

  useEffect(() => {
    if (
      config.mode !== "ANIMATED_SLIDESHOW" ||
      imageUrls.length < 2 ||
      imageFailed ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let cancelled = false;
    const nextIndex = (activeIndex + 1) % imageUrls.length;
    const nextImage = new window.Image();
    nextImage.onerror = () => {
      if (!cancelled) setImageFailed(true);
    };
    nextImage.src = imageUrls[nextIndex];
    const intervalTimer = window.setTimeout(() => {
      nextImage.onload = () => {
        if (cancelled) return;
        setPreviousIndex(activeIndex);
        setActiveIndex(nextIndex);
      };
      if (nextImage.complete && nextImage.naturalWidth > 0) {
        nextImage.onload(new Event("load"));
      }
    }, slideInterval);

    return () => {
      cancelled = true;
      window.clearTimeout(intervalTimer);
    };
  }, [activeIndex, config.mode, imageFailed, imageUrls]);

  const safeImageUrls = imageUrls.length ? imageUrls : [fallbackImage];
  const isVideo =
    config.mode === "VIDEO" && Boolean(config.videoUrl) && !videoFailed;
  const isSlideshow = config.mode === "ANIMATED_SLIDESHOW" && !imageFailed;
  const visibleImage =
    imageFailed || config.mode === "VIDEO" ? fallbackImage : safeImageUrls[activeIndex];

  return (
    <section
      className={`hero hero--managed${isVideo ? " is-video" : ""}`}
      ref={heroRef}
    >
      {isVideo ? (
        <video
          aria-hidden="true"
          autoPlay
          className="hero-video"
          loop
          muted
          onError={() => setVideoFailed(true)}
          playsInline
          poster={fallbackImage}
          preload="metadata"
        >
          <source src={config.videoUrl ?? undefined} type="video/mp4" />
        </video>
      ) : isSlideshow ? (
        <>
          {[...new Set([activeIndex, previousIndex].filter((index) => index !== null))].map((index) => {
            const src = safeImageUrls[index];
            return (
            <Image
              alt=""
              className={`hero-image hero-slide${index === activeIndex ? " is-active" : ""}${index === previousIndex ? " is-previous" : ""}`}
              fill
              key={index}
              onError={() => setImageFailed(true)}
              priority={index === 0}
              sizes="100vw"
              src={src}
            />
            );
          })}
        </>
      ) : (
        <Image
          alt="African safari landscape"
          className="hero-image hero-image-parallax"
          fill
          onError={() => setImageFailed(true)}
          priority
          sizes="100vw"
          src={visibleImage}
        />
      )}
      <div className="hero-shade" />
      <div className="hero-content page-width">
        <div className="hero-copy">
          <span className="eyebrow eyebrow-light">
            <span className="eyebrow-line" />
            A safari, made yours
          </span>
          <h1>{config.headingText}</h1>
          <p>{config.subheadingText}</p>
          <div className="hero-actions">
            <Link className="button button-gold" href="/safaris">
              Explore our journeys <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
            <span className="hero-note">Personal planning. Local perspective.</span>
          </div>
        </div>
        <SafariSearch destinations={destinations} />
        <a className="scroll-cue" href="#destinations">
          <span>Explore destinations</span>
          <ArrowDown size={15} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}

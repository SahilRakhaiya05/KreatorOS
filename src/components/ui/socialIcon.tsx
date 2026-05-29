"use client";

import React from "react";

interface SocialIconProps {
  platform: string;
  className?: string;
}

export function SocialIcon({ platform, className = "h-5 w-5" }: SocialIconProps) {
  const norm = platform.toLowerCase().trim();

  // Handle user-specified high-fidelity SVGs for Threads, Bandcamp, and Mixcloud
  if (norm === "threads") {
    return (
      <svg viewBox="0 0 640 640" className={className}>
        <path
          fill="currentColor"
          d="M427.5 299.7C429.7 300.6 431.7 301.6 433.8 302.5C463 316.6 484.4 337.7 495.6 363.9C511.3 400.4 512.8 459.7 465.3 507.1C429.1 543.3 385 559.6 322.7 560.1L322.4 560.1C252.2 559.6 198.3 536 162 489.9C129.7 448.9 113.1 391.8 112.5 320.3L112.5 319.8C113 248.3 129.6 191.2 161.9 150.2C198.2 104.1 252.2 80.5 322.4 80L322.7 80C393 80.5 447.6 104 485 149.9C503.4 172.6 517 199.9 525.6 231.6L485.2 242.4C478.1 216.6 467.4 194.6 453 177C423.8 141.2 380 122.8 322.5 122.4C265.5 122.9 222.4 141.2 194.3 176.8C168.1 210.1 154.5 258.3 154 320C154.5 381.7 168.1 429.9 194.3 463.3C222.3 498.9 265.5 517.2 322.5 517.7C373.9 517.3 407.9 505.1 436.2 476.8C468.5 444.6 467.9 405 457.6 380.9C451.5 366.7 440.5 354.9 425.7 346C422 372.9 413.9 394.3 401 410.8C383.9 432.6 359.6 444.4 328.3 446.1C304.7 447.4 282 441.7 264.4 430.1C243.6 416.3 231.4 395.3 230.1 370.8C227.6 322.5 265.8 287.8 325.3 284.4C346.4 283.2 366.2 284.1 384.5 287.2C382.1 272.4 377.2 260.6 369.9 252C359.9 240.3 344.3 234.3 323.7 234.2L323 234.2C306.4 234.2 284 238.8 269.7 260.5L235.3 236.9C254.5 207.8 285.6 191.8 323.1 191.8L323.9 191.8C386.5 192.2 423.8 231.3 427.6 299.5L427.4 299.7L427.5 299.7zM271.5 368.5C272.8 393.6 299.9 405.3 326.1 403.8C351.7 402.4 380.7 392.4 385.6 330.6C372.4 327.7 357.8 326.2 342.2 326.2C337.4 326.2 332.6 326.3 327.8 326.6C284.9 329 270.6 349.8 271.6 368.4L271.5 368.5z"
        />
      </svg>
    );
  }

  if (norm === "bandcamp") {
    return (
      <svg viewBox="0 0 640 640" className={className}>
        <path
          fill="#629AA9"
          d="M320 72C183 72 72 183 72 320C72 457 183 568 320 568C457 568 568 457 568 320C568 183 457 72 320 72zM368.2 398.1L187.2 398.1L271.9 242L452.9 242L368.2 398.1z"
        />
      </svg>
    );
  }

  if (norm === "mixcloud") {
    return (
      <svg viewBox="0 0 640 640" className={className}>
        <path
          fill="rgb(0, 92, 255)"
          d="M213 410.6L179.8 410.6L179.8 259.1L186 237.5L175.3 237.5L137.2 410.6L76.2 410.6L37.8 237.5L27.3 237.5L33.2 259.1L33.2 410.6L0 410.6L0 229L65.7 229L102.3 402.1L110.8 402.1L147.4 229L213.1 229L213.1 410.6zM544.5 347.6L458.5 409.7L458.5 371.6L531.4 319.8L458.5 268L458.5 229.9L544.5 292.2L553.8 292.2L640.1 229.9L640.1 268L567 319.8L640.1 371.6L640.1 409.7L553.8 347.6L544.5 347.6zM430.2 336.3L248.2 336.3L248.2 303.2L430.2 303.2L430.2 336.3z"
        />
      </svg>
    );
  }

  // Fallback to Icons8 CDN for other platforms
  let iconName = "";

  switch (norm) {
    case "instagram":
      iconName = "instagram-new";
      break;
    case "x / twitter":
    case "x":
    case "twitter":
      iconName = "twitterx--v2";
      break;
    case "facebook":
      iconName = "facebook-new";
      break;
    case "reddit":
      iconName = "reddit";
      break;
    case "pinterest":
      iconName = "pinterest";
      break;
    case "youtube":
      iconName = "youtube-play";
      break;
    case "tiktok":
      iconName = "tiktok";
      break;
    case "twitch":
      iconName = "twitch";
      break;
    case "vimeo":
      iconName = "vimeo";
      break;
    case "spotify":
      iconName = "spotify";
      break;
    case "soundcloud":
      iconName = "soundcloud";
      break;
    case "apple music":
      iconName = "apple-music";
      break;
    case "youtube music":
      iconName = "youtube-music";
      break;
    case "whatsapp":
      iconName = "whatsapp";
      break;
    case "telegram":
      iconName = "telegram-app";
      break;
    case "discord":
      iconName = "discord-logo";
      break;
    case "snapchat":
      iconName = "snapchat";
      break;
    case "linkedin":
      iconName = "linkedin";
      break;
    case "github":
      iconName = "github";
      break;
    case "medium":
      iconName = "medium-monogram";
      break;
    case "imdb":
      iconName = "imdb";
      break;
    case "behance":
      iconName = "behance";
      break;
    case "dribbble":
      iconName = "dribbble";
      break;
    case "patreon":
      iconName = "patreon";
      break;
    case "website":
      iconName = "globe--v1";
      break;
    case "email":
      iconName = "gmail-new";
      break;
    default:
      iconName = "link--v1";
      break;
  }

  const srcUrl = `https://img.icons8.com/color/96/${iconName}.png`;

  return (
    <img
      src={srcUrl}
      alt={platform}
      className={className}
      loading="lazy"
    />
  );
}

import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width="1em"
      height="1em"
      {...props}
    >
      <path fill="none" d="M0 0h256v256H0z" />
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={16}
        d="M128 216v-80L82.1 98.7a52 52 0 1 1 91.8 0L128 136M56 108V80a72 72 0 0 1 144 0v28"
      />
      <circle
        cx={128}
        cy={128}
        r={28}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={16}
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={16}
        d="M176 172a28 28 0 1 1-40-24.3v-19.4m-16 43.7v-19.4a28 28 0 1 0-40 24.3"
      />
    </svg>
  );
}

import React from 'react';

/* ──────────────────────────────────────────────────
   SHARED DEFAULTS
   All icons accept { size, className, color } props
   Default color uses currentColor so it inherits.
   ────────────────────────────────────────────────── */
const defaults = { size: 24, className: '', color: 'currentColor' };
const svgBase = (size, className) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  className,
  style: { display: 'inline-block', verticalAlign: 'middle' },
});

/* ─── PORT SCANNER ─── Eye with vertical oval pupil */
export const PortScannerIcon = ({ size = 24, className = '', color = 'currentColor' }) => (
  <svg {...svgBase(size, className)}>
    <path
      d="M2 12C2 12 5.636 5 12 5s10 7 10 7-3.636 7-10 7S2 12 2 12Z"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    />
    <ellipse cx="12" cy="12" rx="3.2" ry="5" stroke={color} strokeWidth="1.8" />
    <circle cx="12" cy="12" r="1.2" fill={color} opacity="0.5" />
  </svg>
);

/* ─── SUBDOMAIN FINDER ─── DNS tree: root node branching to children */
export const SubdomainFinderIcon = ({ size = 24, className = '', color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', ...props.style }} {...props}>

    <path d="M24 38.8C15.8 38.8 9.19995 32.2 9.19995 24C9.19995 15.8 15.8 9.20001 24 9.20001C32.2 9.20001 38.7999 15.8 38.7999 24C38.7999 32.2 32.2 38.8 24 38.8ZM24 11.2C16.9 11.2 11.2 16.9 11.2 24C11.2 31.1 16.9 36.8 24 36.8C31.1 36.8 36.7999 31.1 36.7999 24C36.7999 16.9 31.1 11.2 24 11.2Z" fill={color}/>
    <path d="M24 32.8C19.2 32.8 15.2 28.9 15.2 24C15.2 19.2 19.1 15.2 24 15.2C28.9 15.2 32.7999 19.1 32.7999 24C32.7999 28.8 28.8 32.8 24 32.8ZM24 17.2C20.3 17.2 17.2 20.2 17.2 24C17.2 27.7 20.2 30.8 24 30.8C27.7 30.8 30.8 27.8 24 24C30.8 20.3 27.7 17.2 24 17.2Z" fill={color}/>
    <path d="M26.9 23.8C26.9 25.3 25.7 26.5 24.2 26.5C22.7 26.5 21.5 25.3 21.5 23.8C21.5 22.3 22.7 21.1 24.2 21.1C25.7 21.1 26.9 22.4 26.9 23.8Z" fill={color}/>
    <path d="M12.2801 10.5431L10.8655 11.9569L32.3552 33.4588L33.7698 32.045L12.2801 10.5431Z" fill={color}/>
    <path d="M17.8 17.7L10.7 17.1L5 10.7L10.9 10.8L10.7 4.79999L17.1 10.6L17.8 17.7ZM11.7 15.2L15.6 15.5L15.2 11.6L12.8 9.39999L12.9 12.8L9.6 12.7L11.7 15.2Z" fill={color}/>
    <path d="M37.2999 43.1L30.9 37.3L30.2 30.3L37.2999 30.9L43 37.3L37.0999 37.2L37.2999 43.1ZM32.7999 36.3L35.2 38.5L35.0999 35.1L38.4 35.2L36.2999 32.9L32.4 32.6L32.7999 36.3Z" fill={color}/>
    <path d="M36.1508 10.5301L14.658 32.0289L16.0724 33.4429L37.5652 11.9441L36.1508 10.5301Z" fill={color}/>
    <path d="M30.3 17.7L31 10.7L37.4001 4.90002L37.2001 10.9L43.1 10.8L37.4001 17.2L30.3 17.7ZM32.9001 11.7L32.5 15.6L36.4001 15.3L38.5 13L35.2001 13.1L35.3 9.70002L32.9001 11.7Z" fill={color}/>
    <path d="M10.7 43.1L10.9 37.1L5 37.3L10.7 30.9L17.8 30.3L17.1 37.3L10.7 43.1ZM12.9 35.1L12.8 38.5L15.2 36.3L15.6 32.4L11.7 32.7L9.6 35L12.9 35.1Z" fill={color}/>
  </svg>
);

/* ─── ATTACK SURFACE ─── Radar sweep with detection pings */
export const AttackSurfaceIcon = ({ size = 24, className = '', color = 'currentColor' }) => (
  <svg {...svgBase(size, className)}>
    <circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.5" opacity="0.25" />
    <circle cx="12" cy="12" r="6.5" stroke={color} strokeWidth="1.5" opacity="0.4" />
    <circle cx="12" cy="12" r="3.5" stroke={color} strokeWidth="1.5" opacity="0.6" />
    <line x1="12" y1="12" x2="12" y2="2.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M12 12 L18.5 5.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <circle cx="16" cy="8" r="1.3" fill={color} opacity="0.7" />
    <circle cx="8.5" cy="15" r="1" fill={color} opacity="0.5" />
  </svg>
);

/* ─── TRAFFIC ANALYSIS ─── Network flow lines with data packets */
export const TrafficAnalysisIcon = ({ size = 24, className = '', color = 'currentColor' }) => (
  <svg {...svgBase(size, className)}>
    <path d="M3 8h18" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
    <path d="M3 12h18" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
    <path d="M3 16h18" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
    <rect x="5" y="6" width="4" height="4" rx="1" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.12" />
    <rect x="13" y="10" width="4" height="4" rx="1" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.12" />
    <rect x="8" y="14" width="4" height="4" rx="1" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.12" />
    <path d="M9 8L13 12" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeDasharray="2 2" opacity="0.5" />
    <path d="M17 12L12 16" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeDasharray="2 2" opacity="0.5" />
  </svg>
);

/* ─── WEBSITE SCANNER ─── Browser window with scan crosshair */
export const WebsiteScannerIcon = ({ size = 24, className = '', color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', ...props.style }} {...props}>
    <path fill={color} d="M256,0C114.615,0,0,114.615,0,256s114.615,256,256,256s256-114.615,256-256S397.385,0,256,0z M418.275,146h-46.667  c-5.365-22.513-12.324-43.213-20.587-61.514c15.786,8.776,30.449,19.797,43.572,32.921C403.463,126.277,411.367,135.854,418.275,146  z M452,256c0,17.108-2.191,33.877-6.414,50h-64.034c1.601-16.172,2.448-32.887,2.448-50s-0.847-33.828-2.448-50h64.034  C449.809,222.123,452,238.892,452,256z M256,452c-5.2,0-21.048-10.221-36.844-41.813c-6.543-13.087-12.158-27.994-16.752-44.187  h107.191c-4.594,16.192-10.208,31.1-16.752,44.187C277.048,441.779,261.2,452,256,452z M190.813,306  c-1.847-16.247-2.813-33.029-2.813-50s0.966-33.753,2.813-50h130.374c1.847,16.247,2.813,33.029,2.813,50s-0.966,33.753-2.813,50  H190.813z M60,256c0-17.108,2.191-33.877,6.414-50h64.034c-1.601,16.172-2.448,32.887-2.448,50s0.847,33.828,2.448,50H66.414  C62.191,289.877,60,273.108,60,256z M256,60c5.2,0,21.048,10.221,36.844,41.813c6.543,13.087,12.158,27.994,16.752,44.187H202.404  c4.594-16.192,10.208-31.1,16.752-44.187C234.952,70.221,250.8,60,256,60z M160.979,84.486c-8.264,18.301-15.222,39-20.587,61.514  H93.725c6.909-10.146,14.812-19.723,23.682-28.593C130.531,104.283,145.193,93.262,160.979,84.486z M93.725,366h46.667  c5.365,22.513,12.324,43.213,20.587,61.514c-15.786-8.776-30.449-19.797-43.572-32.921C108.537,385.723,100.633,376.146,93.725,366z   M351.021,427.514c8.264-18.301,15.222-39,20.587-61.514h46.667c-6.909,10.146-14.812,19.723-23.682,28.593  C381.469,407.717,366.807,418.738,351.021,427.514z"/>
  </svg>
);

/* ─── EMAIL SCANNER ─── Envelope with shield check overlay */
export const EmailScannerIcon = ({ size = 24, className = '', color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', ...props.style }} {...props}>
    <g fill={color}>
      <path d="M19 14.5v-9c0-.83-.67-1.5-1.5-1.5H3.49c-.83 0-1.5.67-1.5 1.5v9c0 .83.67 1.5 1.5 1.5H17.5c.83 0 1.5-.67 1.5-1.5zm-1.31-9.11c.33.33.15.67-.03.84L13.6 9.95l3.9 4.06c.12.14.2.36.06.51-.13.16-.43.15-.56.05l-4.37-3.73-2.14 1.95-2.13-1.95-4.37 3.73c-.13.1-.43.11-.56-.05-.14-.15-.06-.37.06-.51l3.9-4.06-4.06-3.72c-.18-.17-.36-.51-.03-.84s.67-.17.95.07l6.24 5.04 6.25-5.04c.28-.24.62-.4.95-.07z"/>
    </g>
  </svg>
);

/* ─── CODE SCANNER ─── Code brackets with bug/magnifier */
export const CodeScannerIcon = ({ size = 24, className = '', color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', ...props.style }} {...props}>
    <path d="M7 8L3 11.6923L7 16M17 8L21 11.6923L17 16M14 4L10 20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ─── NETWORK SCANNER ─── Network topology diagram */
export const NetworkScannerIcon = ({ size = 24, className = '', color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', ...props.style }} {...props}>
    <path d="M3 12H21M12 8V12M6.5 12V16M17.5 12V16M10.1 8H13.9C14.4601 8 14.7401 8 14.954 7.89101C15.1422 7.79513 15.2951 7.64215 15.391 7.45399C15.5 7.24008 15.5 6.96005 15.5 6.4V4.6C15.5 4.03995 15.5 3.75992 15.391 3.54601C15.2951 3.35785 15.1422 3.20487 14.954 3.10899C14.7401 3 14.4601 3 13.9 3H10.1C9.53995 3 9.25992 3 9.04601 3.10899C8.85785 3.20487 8.70487 3.35785 8.60899 3.54601C8.5 3.75992 8.5 4.03995 8.5 4.6V6.4C8.5 6.96005 8.5 7.24008 8.60899 7.45399C8.70487 7.64215 8.85785 7.79513 9.04601 7.89101C9.25992 8 9.53995 8 10.1 8ZM15.6 21H19.4C19.9601 21 20.2401 21 20.454 20.891C20.6422 20.7951 20.7951 20.6422 20.891 20.454C21 20.2401 21 19.9601 21 19.4V17.6C21 17.0399 21 16.7599 20.891 16.546C20.7951 16.3578 20.6422 16.2049 20.454 16.109C20.2401 16 19.9601 16 19.4 16H15.6C15.0399 16 14.7599 16 14.546 16.109C14.3578 16.2049 14.2049 16.3578 14.109 16.546C14 16.7599 14 17.0399 14 17.6V19.4C14 19.9601 14 20.2401 14.109 20.454C14.2049 20.6422 14.3578 20.7951 14.546 20.891C14.7599 21 15.0399 21 15.6 21ZM4.6 21H8.4C8.96005 21 9.24008 21 9.45399 20.891C9.64215 20.7951 9.79513 20.6422 9.89101 20.454C10 20.2401 10 19.9601 10 19.4V17.6C10 17.0399 10 16.7599 9.89101 16.546C9.79513 16.3578 9.64215 16.2049 9.45399 16.109C9.24008 16 8.96005 16 8.4 16H4.6C4.03995 16 3.75992 16 3.54601 16.109C3.35785 16.2049 3.20487 16.3578 3.10899 16.546C3 16.7599 3 17.0399 3 17.6V19.4C3 19.9601 3 20.2401 3.10899 20.454C3.20487 20.6422 3.35785 20.7951 3.54601 20.891C3.75992 21 4.03995 21 4.6 21Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ─── MALICIOUS URL ─── Chain link with warning alert */
export const MaliciousUrlIcon = ({ size = 24, className = '', color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 -0.5 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', ...props.style }} {...props}>
    <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <g transform="translate(-299.000000, -600.000000)" fill={color}>
        <g transform="translate(56.000000, 160.000000)">
          <path d="M246.400111,448.948654 C244.519883,447.158547 244.754644,444.106996 247.102248,442.631229 C248.809889,441.557573 251.103895,441.880078 252.551048,443.257869 L253.222099,443.896756 C253.641237,444.295804 254.319791,444.295804 254.737858,443.896756 C255.156996,443.498727 255.156996,442.852696 254.737858,442.453648 L254.170788,441.913758 C251.680612,439.542937 247.589992,439.302079 245.025851,441.600438 C242.372737,443.979423 242.32557,447.956645 244.884352,450.391762 L245.642231,451.113316 C246.060298,451.512365 246.739924,451.512365 247.15799,451.113316 C247.577129,450.715288 247.577129,450.069257 247.15799,449.670208 L246.400111,448.948654 Z M261.976841,449.345662 L261.430138,448.825163 C261.011,448.426114 260.332446,448.426114 259.914379,448.825163 C259.495241,449.223192 259.495241,449.869222 259.914379,450.268271 L260.585429,450.907158 C262.032583,452.284948 262.370252,454.469002 261.243616,456.094794 C259.693554,458.329877 256.487306,458.552364 254.60815,456.763278 L253.850271,456.041724 C253.431132,455.642675 252.752578,455.642675 252.334511,456.041724 C251.915373,456.439752 251.915373,457.085783 252.334511,457.484832 L253.092391,458.206386 C255.643669,460.63538 259.806111,460.597618 262.305934,458.09106 C264.742511,455.648799 264.478808,451.727709 261.976841,449.345662 L261.976841,449.345662 Z M257.639668,455.32017 L247.91587,446.062438 C247.497803,445.663389 247.497803,445.017358 247.91587,444.61831 C248.335008,444.220281 249.013562,444.220281 249.431629,444.61831 L259.156499,453.876041 C259.574566,454.27509 259.574566,454.921121 259.156499,455.32017 C258.737361,455.718198 258.058807,455.718198 257.639668,455.32017 L257.639668,455.32017 Z" />
        </g>
      </g>
    </g>
  </svg>
);

/* ─── FIREWALL ADVISOR ─── Brick wall with flame/spark */
export const FirewallAdvisorIcon = ({ size = 24, className = '', color = 'currentColor' }) => (
  <svg {...svgBase(size, className)}>
    <rect x="3" y="4" width="18" height="4" rx="1" stroke={color} strokeWidth="1.5" opacity="0.6" />
    <line x1="10" y1="4" x2="10" y2="8" stroke={color} strokeWidth="1.3" opacity="0.4" />
    <rect x="3" y="10" width="18" height="4" rx="1" stroke={color} strokeWidth="1.5" opacity="0.6" />
    <line x1="14" y1="10" x2="14" y2="14" stroke={color} strokeWidth="1.3" opacity="0.4" />
    <rect x="3" y="16" width="18" height="4" rx="1" stroke={color} strokeWidth="1.5" opacity="0.6" />
    <line x1="8" y1="16" x2="8" y2="20" stroke={color} strokeWidth="1.3" opacity="0.4" />
    <path
      d="M17 8C17 8 15.5 10 16 12C16.3 13.2 17 13.5 17 13.5C17 13.5 17.7 13.2 18 12C18.5 10 17 8 17 8Z"
      fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1" strokeLinejoin="round"
    />
  </svg>
);

/* ─── SECURITY SCORES ─── Gauge meter with score arc */
export const SecurityScoresIcon = ({ size = 24, className = '', color = 'currentColor' }) => (
  <svg {...svgBase(size, className)}>
    <path
      d="M5 17A8 8 0 0 1 19 17"
      stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.25"
    />
    <path
      d="M5 17A8 8 0 0 1 16.5 8"
      stroke={color} strokeWidth="2.2" strokeLinecap="round"
    />
    <line x1="12" y1="17" x2="15" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="17" r="1.8" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.3" />
    <text x="12" y="22.5" textAnchor="middle" fill={color} fontSize="4" fontWeight="700" opacity="0.6">A+</text>
  </svg>
);

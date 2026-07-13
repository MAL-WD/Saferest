import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiZap, FiEye, FiLock, FiArrowRight, FiCheck, FiStar, FiActivity, FiGlobe, FiUsers, FiServer, FiCpu } from 'react-icons/fi';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './Landing.module.css';
import dashboardImg from '../assets/Dashboard.svg';

gsap.registerPlugin(ScrollTrigger);



const STEPS = [
  {
    number: '1',
    title: 'Assessment',
    description: 'We scan and index your digital footprint, detecting all active exposed assets, open ports, and potential attack paths in real-time.'
  },
  {
    number: '2',
    title: 'Threat Analysis',
    description: 'Our advanced reasoning models evaluate vulnerability scores, separating true critical threats from false positives automatically.'
  },
  {
    number: '3',
    title: 'Planning',
    description: 'Through our extensive research, we have developed a tried & tailored security strategy designed to address essential fixes & improvements. This approach not only enhances your security also guarantees that daily operations continue smoothly without disruption.'
  },
  {
    number: '4',
    title: 'Implementation',
    description: 'Deploy automatic patches, firewall advisory rules, and secure API gateways in a single click without breaking legacy infrastructure.'
  },
  {
    number: '5',
    title: 'Optimization',
    description: 'Continuous threat monitoring and automated rescans optimize your defensive posture 24/7/365, adapting to new zero-days instantly.'
  }
];

const SERVICES = [
  {
    title: 'Subdomain Finder',
    description: 'Automated recursive DNS and OSINT lookup to map your organization\'s complete subdomain blueprint and discover hidden asset exposures.',
    icon: FiGlobe,
    color: '#ACEC00',
    rgb: '172, 236, 0',
    tag: 'RECON'
  },
  {
    title: 'Port Scanner',
    description: 'Ultra-fast, massive parallel service profiling with banner grabbing and instant vulnerabilities signature matching.',
    icon: FiCpu,
    color: '#00e5ff',
    rgb: '0, 229, 255',
    tag: 'PORT SCAN'
  },
  {
    title: 'Code Scanner',
    description: 'Deep static & dynamic analysis (SAST/DAST) of target Git repositories to detect API keys, exposed secrets, and severe code bugs.',
    icon: FiLock,
    color: '#ff6b6b',
    rgb: '255, 107, 107',
    tag: 'APPSC SCAN'
  },
  {
    title: 'Malicious URL Detection',
    description: 'Real-time validation of outbound endpoints, active links, and phishing exposure using advanced intelligence verification.',
    icon: FiEye,
    color: '#ffb938',
    rgb: '255, 185, 56',
    tag: 'URL INTEL'
  },
  {
    title: 'Email Threat Profiler',
    description: 'Evaluates MX/SPF/DKIM/DMARC server integrity settings, credentials leaks, and active domain spoofing risk metrics.',
    icon: FiUsers,
    color: '#e066ff',
    rgb: '224, 102, 255',
    tag: 'EMAIL SEC'
  }
];


export default function Landing() {
  const [activeStep, setActiveStep] = useState(2);
  const bgCanvasRef = useRef(null);
  const netCanvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cursorRef = useRef(null);
  const cursorRingRef = useRef(null);
  const shieldRef = useRef(null);
  const dashboardTiltRef = useRef(null);
  const dashboardScrollRef = useRef(null);

  // Floating cards refs
  const card1Ref = useRef(null);
  const card2Ref = useRef(null);
  const card3Ref = useRef(null);
  const card4Ref = useRef(null);

  useEffect(() => {
    document.title = 'Saferest | Professional Security Suite';
    // ═══════════════════════════════════════════════════════════
    //  CUSTOM CURSOR TRACKING
    // ═══════════════════════════════════════════════════════════
    const cursor = cursorRef.current;
    const ring = cursorRingRef.current;
    if (!cursor || !ring) return;

    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;
    let rx = cx;
    let ry = cy;

    const onMouseMove = (e) => {
      cx = e.clientX;
      cy = e.clientY;
      gsap.to(cursor, { x: cx, y: cy, duration: 0.05, overwrite: 'auto' });
    };

    window.addEventListener('mousemove', onMouseMove);

    let ringAnimFrame;
    const animRing = () => {
      rx += (cx - rx) * 0.1;
      ry += (cy - ry) * 0.1;
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      ringAnimFrame = requestAnimationFrame(animRing);
    };
    animRing();

    // Hover effect on interactive elements
    const interactiveElements = document.querySelectorAll('a, button, input, tr, [data-hover]');
    const onMouseEnter = () => {
      gsap.to(ring, { width: 56, height: 56, borderColor: 'rgba(172, 236, 0, 0.7)', duration: 0.3 });
      gsap.to(cursor, { scale: 1.5, duration: 0.3 });
    };
    const onMouseLeave = () => {
      gsap.to(ring, { width: 36, height: 36, borderColor: 'rgba(172, 236, 0, 0.45)', duration: 0.3 });
      gsap.to(cursor, { scale: 1, duration: 0.3 });
    };

    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', onMouseEnter);
      el.addEventListener('mouseleave', onMouseLeave);
    });

    // ═══════════════════════════════════════════════════════════
    //  AURORA BACKGROUND CANVAS ANIMATION
    // ═══════════════════════════════════════════════════════════
    const bgCanvas = bgCanvasRef.current;
    const bgCtx = bgCanvas.getContext('2d');
    let bgW, bgH, bgT = 0;
    let bgResizeFrame;

    const resizeBg = () => {
      bgW = bgCanvas.width = bgCanvas.offsetWidth || window.innerWidth;
      bgH = bgCanvas.height = bgCanvas.offsetHeight || window.innerHeight;
    };
    window.addEventListener('resize', resizeBg);
    resizeBg();

    const orbs = [
      { cx: 0.2, cy: 0.3, r: 0.55, color: [1, 63, 246], speed: 0.00025, ox: 0.12, oy: 0.08 },
      { cx: 0.75, cy: 0.6, r: 0.45, color: [172, 236, 0], speed: 0.00018, ox: 0.10, oy: 0.12 },
      { cx: 0.5, cy: 0.15, r: 0.5, color: [0, 150, 220], speed: 0.00020, ox: 0.09, oy: 0.07 },
      { cx: 0.85, cy: 0.2, r: 0.4, color: [1, 63, 246], speed: 0.00030, ox: 0.07, oy: 0.10 },
      { cx: 0.1, cy: 0.8, r: 0.38, color: [80, 200, 120], speed: 0.00022, ox: 0.11, oy: 0.09 },
    ];

    let bgAnimFrame;
    const drawBg = () => {
      bgT++;
      bgCtx.clearRect(0, 0, bgW, bgH);

      // Deep dark base removed so CSS background image can be seen
      // bgCtx.fillStyle = '#00182E';
      // bgCtx.fillRect(0, 0, bgW, bgH);

      // Aurora blobs

      orbs.forEach((orb, i) => {
        const phase = bgT * orb.speed + i * 1.3;
        const x = (orb.cx + Math.sin(phase * 3.1) * orb.ox) * bgW;
        const y = (orb.cy + Math.cos(phase * 2.7) * orb.oy) * bgH;
        const r = orb.r * Math.min(bgW, bgH);

        const g = bgCtx.createRadialGradient(x, y, 0, x, y, r);
        const [cr, cg, cb] = orb.color;
        g.addColorStop(0, `rgba(${cr},${cg},${cb},0.14)`);
        g.addColorStop(0.5, `rgba(${cr},${cg},${cb},0.06)`);
        g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        bgCtx.fillStyle = g;
        bgCtx.beginPath();
        bgCtx.arc(x, y, r, 0, Math.PI * 2);
        bgCtx.fill();
      });

      // Horizontal aurora waves
      for (let i = 0; i < 3; i++) {
        const yPos = bgH * (0.25 + i * 0.25 + Math.sin(bgT * 0.00015 + i) * 0.05);
        const gBand = bgCtx.createLinearGradient(0, yPos - 80, 0, yPos + 80);
        gBand.addColorStop(0, 'transparent');
        gBand.addColorStop(0.5, 'rgba(1, 63, 246, 0.04)');
        gBand.addColorStop(1, 'transparent');
        bgCtx.fillStyle = gBand;
        bgCtx.fillRect(0, yPos - 80, bgW, 160);
      }

      bgAnimFrame = requestAnimationFrame(drawBg);
    };
    drawBg();

    // ═══════════════════════════════════════════════════════════
    //  NETWORK LINES PARTICLES CANVAS
    // ═══════════════════════════════════════════════════════════
    const netCanvas = netCanvasRef.current;
    const netCtx = netCanvas.getContext('2d');
    let netW, netH;
    const particles = [];
    const COUNT = 55;
    const MAX_DIST = 130;
    let netResizeFrame;

    const resizeNet = () => {
      netW = netCanvas.width = netCanvas.offsetWidth;
      netH = netCanvas.height = netCanvas.offsetHeight;
    };
    window.addEventListener('resize', resizeNet);
    resizeNet();

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * (netW || window.innerWidth),
        y: Math.random() * (netH || window.innerHeight),
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? [172, 236, 0] : [1, 63, 246]
      });
    }

    let mx = netW / 2, my = netH / 2;
    const onMouseMoveCanvas = (e) => {
      const rect = netCanvas.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
    };
    netCanvas.addEventListener('mousemove', onMouseMoveCanvas);

    let netAnimFrame;
    const drawNet = () => {
      netCtx.clearRect(0, 0, netW, netH);

      // Mouse attractor physics
      particles.forEach((p) => {
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          p.vx += (dx / dist) * 0.012;
          p.vy += (dy / dist) * 0.012;
        }
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > netW) p.vx *= -1;
        if (p.y < 0 || p.y > netH) p.vy *= -1;
      });

      // Lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.35;
            const [r, g, b] = particles[i].color;
            netCtx.beginPath();
            netCtx.moveTo(particles[i].x, particles[i].y);
            netCtx.lineTo(particles[j].x, particles[j].y);
            netCtx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
            netCtx.lineWidth = 0.8;
            netCtx.stroke();
          }
        }
      }

      // Dots
      particles.forEach((p) => {
        const [r, g, b] = p.color;
        netCtx.beginPath();
        netCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        netCtx.fillStyle = `rgba(${r},${g},${b},0.7)`;
        netCtx.shadowColor = `rgba(${r},${g},${b},0.8)`;
        netCtx.shadowBlur = 6;
        netCtx.fill();
        netCtx.shadowBlur = 0;
      });

      netAnimFrame = requestAnimationFrame(drawNet);
    };
    drawNet();

    // ═══════════════════════════════════════════════════════════
    //  3D PARALLAX / TILT EFFECT
    // ═══════════════════════════════════════════════════════════
    const scene = sceneRef.current;
    const shield = shieldRef.current;
    const cardThreat = card1Ref.current;
    const cardScan = card2Ref.current;
    const cardAi = card3Ref.current;
    const cardNet = card4Ref.current;

    let targetX = 0, targetY = 0, currentX = 0, currentY = 0;

    const onSceneMouseMove = (e) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      targetX = x * 10; // Max horizontal rotate
      targetY = -y * 8; // Max vertical rotate
    };
    window.addEventListener('mousemove', onSceneMouseMove);

    let tiltFrame;
    const tilt = () => {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;

      if (sceneRef.current) {
        sceneRef.current.style.transform = `perspective(1200px) rotateY(${currentX}deg) rotateX(${currentY}deg)`;
      }
      if (dashboardTiltRef.current) {
        dashboardTiltRef.current.style.transform = `perspective(1500px) rotateY(${currentX * 0.8}deg) rotateX(${currentY * 0.8}deg)`;
      }

      // Apply floating card offset margins based on depth levels
      if (cardThreat) {
        cardThreat.style.marginLeft = currentX * 1.6 * 4 + 'px';
        cardThreat.style.marginTop = currentY * 1.6 * 3 + 'px';
      }
      if (cardScan) {
        cardScan.style.marginLeft = currentX * 2.2 * 4 + 'px';
        cardScan.style.marginTop = currentY * 2.2 * 3 + 'px';
      }
      if (cardAi) {
        cardAi.style.marginLeft = currentX * 1.8 * 4 + 'px';
        cardAi.style.marginTop = currentY * 1.8 * 3 + 'px';
      }
      if (cardNet) {
        cardNet.style.marginLeft = currentX * 2.0 * 4 + 'px';
        cardNet.style.marginTop = currentY * 2.0 * 3 + 'px';
      }

      if (shield) {
        shield.style.transform = `rotateY(${currentX * 1.5}deg) rotateX(${currentY * 1.5}deg)`;
      }

      tiltFrame = requestAnimationFrame(tilt);
    };
    tilt();

    // ═══════════════════════════════════════════════════════════
    //  GSAP ENTRANCE ANIMATIONS
    // ═══════════════════════════════════════════════════════════
    // Navbar
    gsap.fromTo(
      `#navbar`,
      { y: -60, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.2 }
    );

    // Hero elements
    gsap.fromTo(
      `#hero-badge`,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.5 }
    );

    gsap.fromTo(
      `#shield`,
      { scale: 0.5, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.2, ease: 'back.out(1.7)', delay: 0.6 }
    );

    gsap.fromTo(
      `#hero-headline`,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.8 }
    );

    gsap.fromTo(
      `#hero-sub`,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 1.0 }
    );

    gsap.fromTo(
      `#hero-cta`,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out', delay: 1.2 }
    );



    // Float cards stagger entrance
    gsap.fromTo(
      [cardThreat, cardScan, cardAi, cardNet],
      { scale: 0.85, opacity: 0, y: 30 },
      {
        scale: 1,
        opacity: 1,
        y: 0,
        stagger: 0.15,
        duration: 0.9,
        ease: 'back.out(1.5)',
        delay: 1.6,
      }
    );
    // Dashboard 3D scroll bend
    const dashboardScroll = dashboardScrollRef.current;
    if (dashboardScroll) {
      gsap.fromTo(
        dashboardScroll,
        { rotateX: 35, scale: 0.9, y: 150, opacity: 0.6 },
        {
          rotateX: 0,
          scale: 1,
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: dashboardScroll,
            start: 'top 90%',
            end: 'top 40%',
            scrub: 1,
          }
        }
      );
    }

    // ═══════════════════════════════════════════════════════════
    //  SCROLL-ON-VIEW TIMELINE STEPPER ANIMATIONS
    // ═══════════════════════════════════════════════════════════
    const timelineItems = gsap.utils.toArray('.timeline-item-el');
    
    timelineItems.forEach((item, index) => {
      // Entrance fade-in for each item as it scrolls into view
      gsap.fromTo(
        item,
        { opacity: 0, x: -40 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 85%',
            toggleActions: 'play none none none',
          }
        }
      );

      // Track scroll position to update the active step visual
      const isLast = index === timelineItems.length - 1;
      ScrollTrigger.create({
        trigger: item,
        start: isLast ? 'top 82%' : 'top 65%',
        end: isLast ? 'bottom 82%' : 'bottom 65%',
        onEnter: () => setActiveStep(index),
        onEnterBack: () => setActiveStep(index),
      });
    });

    // ═══════════════════════════════════════════════════════════
    //  SCROLL-ON-VIEW SERVICES SECTION ANIMATIONS
    // ═══════════════════════════════════════════════════════════
    const servicesHead = document.querySelector('.services-head-el');
    const serviceCards = gsap.utils.toArray('.service-card-el');

    if (servicesHead && serviceCards.length > 0) {
      gsap.fromTo(
        servicesHead,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1.0,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: servicesHead,
            start: 'top 85%',
            toggleActions: 'play none none none',
          }
        }
      );

      gsap.fromTo(
        serviceCards,
        { opacity: 0, y: 50, scale: 0.9, rotateX: 10 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          stagger: 0.1,
          duration: 0.9,
          ease: 'back.out(1.2)',
          scrollTrigger: {
            trigger: '.services-grid-el',
            start: 'top 85%',
            toggleActions: 'play none none none',
          }
        }
      );
    }

    // ── Cleanup event listeners on component unmount ──
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', resizeBg);
      window.removeEventListener('resize', resizeNet);
      window.removeEventListener('mousemove', onSceneMouseMove);
      cancelAnimationFrame(ringAnimFrame);
      cancelAnimationFrame(bgAnimFrame);
      cancelAnimationFrame(netAnimFrame);
      cancelAnimationFrame(tiltFrame);
      ScrollTrigger.getAll().forEach((t) => t.kill());
      interactiveElements.forEach((el) => {
        el.removeEventListener('mouseenter', onMouseEnter);
        el.removeEventListener('mouseleave', onMouseLeave);
      });
    };
  }, []);

  return (
    <div className={styles.page} dir="ltr">
      {/* Custom Cursor */}
      <div ref={cursorRef} className={styles.cursor} />
      <div ref={cursorRingRef} className={styles.cursorRing} />

      {/* Sticky flat header outside 3D Tilt */}
      <header id="navbar" className={styles.header}>
        <Link to="/" className={styles.logo}>
          <img src="/logo.png" alt="Saferest Logo" style={{ height: '48px', width: 'auto', marginRight: '12px' }} />
          <span style={{fontFamily: "'Onest', sans-serif", fontSize: '1.25rem', fontWeight: 800}}>Saferest<strong>.ai</strong></span>
        </Link>
        <ul className={styles.navLinks}>
          <li><a href="#features">Platform</a></li>
          <li><a href="#features">Solutions</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><Link to="/login">Docs</Link></li>
        </ul>
        <div className={styles.navCta}>
          <Link to="/login" className={`${styles.navBtn} ${styles.navBtnGhost}`}>Sign In</Link>
          <Link to="/register" className={`${styles.navBtn} ${styles.navBtnSolid}`}>Get Access</Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        {/* Background Canvases confined strictly to Hero */}
        <canvas ref={bgCanvasRef} className={styles.bgCanvas} />
        <div className={styles.noiseOverlay} />
        <div className={styles.gridOverlay} />

        {/* Futuristic SVG Gradient Ribbon Loop */}
        <svg className={styles.svgBackground} viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#013FF6" />
              <stop offset="30%" stopColor="#00E5FF" />
              <stop offset="65%" stopColor="#ACEC00" />
              <stop offset="85%" stopColor="#00E5FF" />
              <stop offset="100%" stopColor="#013FF6" />
            </linearGradient>
            
            <linearGradient id="ribbonGradGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#013FF6" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#ACEC00" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#013FF6" stopOpacity="0.4" />
            </linearGradient>

            <pattern id="ribbonGrid" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
              <line x1="0" y1="0" x2="0" y2="40" stroke="rgba(255, 255, 255, 0.09)" strokeWidth="1" />
              <line x1="0" y1="0" x2="40" y2="0" stroke="rgba(255, 255, 255, 0.09)" strokeWidth="1" />
            </pattern>

            <filter id="svgGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="35" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Blurred Glow path - Sweeping S-Curve */}
          <path d="M -150,300 C 350,-100 150,850 720,450 C 1200,50 1000,950 1600,600" 
                className={styles.animatedPathGlow}
                fill="none" stroke="url(#ribbonGradGlow)" strokeWidth="120" strokeLinecap="round" filter="url(#svgGlow)" opacity="0.75" />

          {/* Glassy Ribbon Main - Sweeping S-Curve */}
          <path d="M -150,300 C 350,-100 150,850 720,450 C 1200,50 1000,950 1600,600" 
                className={styles.animatedPath}
                fill="none" stroke="url(#ribbonGrad)" strokeWidth="80" strokeLinecap="round" opacity="0.85" />

          {/* Tech Grid Pattern embedded inside ribbon */}
          <path d="M -150,300 C 350,-100 150,850 720,450 C 1200,50 1000,950 1600,600" 
                className={styles.animatedPath}
                fill="none" stroke="url(#ribbonGrid)" strokeWidth="76" strokeLinecap="round" opacity="0.8" />

          {/* Ultra thin light highlights */}
          <path d="M -150,300 C 350,-100 150,850 720,450 C 1200,50 1000,950 1600,600" 
                className={styles.animatedPath}
                fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />

          {/* Glowing Energy Pulse moving from start to end - matching the 80px line width */}
          <path d="M -150,300 C 350,-100 150,850 720,450 C 1200,50 1000,950 1600,600" 
                className={`${styles.animatedPath} ${styles.energyPulse}`}
                fill="none" stroke="url(#ribbonGrad)" strokeWidth="80" strokeLinecap="round" filter="url(#svgGlow)" opacity="0.95" />
        </svg>

        {/* Glow blobs inside hero for depth */}
        <div className={`${styles.glowBlob} ${styles.blob1}`} />
        <div className={`${styles.glowBlob} ${styles.blob2}`} />
        <div className={`${styles.glowBlob} ${styles.blob3}`} />

        {/* Scene wrapper holds the 3D-tilting world, confined inside Hero */}
        <div className={styles.scene}>
          <canvas ref={netCanvasRef} className={styles.netCanvas} />
          <div className={styles.scanline} />

          {/* Floating cards */}
          <div ref={sceneRef} className={styles.floatingCards} style={{ transformStyle: 'preserve-3d' }}>
            {/* Card 1: Threat Detected */}
            <div ref={card1Ref} className={`${styles.floatCard} ${styles.cardThreat}`}>
              <div className={styles.cardHeader}>
                <div className={`${styles.cardIcon} ${styles.iconRed}`}>
                  <FiShield size={14} color="#ff6b6b" />
                </div>
                <span className={styles.cardTitle}>Threat Detected</span>
              </div>
              <div className={styles.cardValue}>CVE-2024</div>
              <div className={styles.cardSub}>SQL Injection — Critical</div>
              <div className={`${styles.cardBadge} ${styles.badgeRed}`}>
                <span>●</span> LIVE
              </div>
              <svg className={styles.sparkline} viewBox="0 0 200 36" preserveAspectRatio="none">
                <polyline points="0,30 30,22 55,26 80,10 105,18 130,8 155,14 180,5 200,12"
                   fill="none" stroke="rgba(255,80,80,0.6)" strokeWidth="1.5" />
                <polyline points="0,30 30,22 55,26 80,10 105,18 130,8 155,14 180,5 200,12 200,36 0,36"
                   fill="url(#spark-red)" stroke="none" />
                <defs>
                  <linearGradient id="spark-red" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="rgba(255,80,80,0.2)" />
                    <stop offset="100%" stop-color="rgba(255,80,80,0)" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Card 2: Active Scan */}
            <div ref={card2Ref} className={`${styles.floatCard} ${styles.cardScan}`}>
              <div className={styles.cardHeader}>
                <div className={`${styles.cardIcon} ${styles.iconGreen}`}>
                  <FiActivity size={14} color="#ACEC00" />
                </div>
                <span className={styles.cardTitle}>Active Scan</span>
              </div>
              <div className={styles.cardValue}>78%</div>
              <div className={styles.cardSub}>api.production.internal</div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: '78%' }} />
              </div>
              <div className={`${styles.cardBadge} ${styles.badgeGreen}`} style={{ marginTop: '10px' }}>
                ✓ 142 endpoints found
              </div>
            </div>

            {/* Card 3: AI Analysis */}
            <div ref={card3Ref} className={`${styles.floatCard} ${styles.cardAi}`}>
              <div className={styles.cardHeader}>
                <div className={`${styles.cardIcon} ${styles.iconBlue}`}>
                  <FiCpu size={14} color="#013FF6" />
                </div>
                <span className={styles.cardTitle}>AI Analysis</span>
              </div>
              <div className={styles.cardValue} style={{ fontSize: '1rem', color: 'rgba(200,220,255,0.9)' }}>
                Reasoning complete
              </div>
              <div className={styles.cardSub} style={{ marginTop: '6px', lineHeight: 1.5 }}>
                Detected anomalous outbound traffic pattern on port 443 — potential C2 beacon.
              </div>
              <div className={`${styles.cardBadge} ${styles.badgeBlue}`} style={{ marginTop: '8px' }}>
                AI Confidence 97.3%
              </div>
            </div>

            {/* Card 4: Network Monitor */}
            <div ref={card4Ref} className={`${styles.floatCard} ${styles.cardNet}`}>
              <div className={styles.cardHeader}>
                <div className={`${styles.cardIcon} ${styles.iconCyan}`}>
                  <FiGlobe size={14} color="#00e5ff" />
                </div>
                <span className={styles.cardTitle}>Network Monitor</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <div>
                  <div className={styles.cardValue} style={{ fontSize: '1.1rem' }}>2.4k</div>
                  <div className={styles.cardSub}>Nodes Active</div>
                </div>
                <div>
                  <div className={styles.cardValue} style={{ fontSize: '1.1rem', color: '#ACEC00' }}>99.9%</div>
                  <div className={styles.cardSub}>Uptime</div>
                </div>
                <div>
                  <div className={styles.cardValue} style={{ fontSize: '1.1rem', color: '#ff6b6b' }}>3</div>
                  <div className={styles.cardSub}>Alerts</div>
                </div>
              </div>
              <div className={styles.progressTrack} style={{ marginTop: '12px' }}>
                <div className={styles.progressFill} style={{ width: '92%', background: 'linear-gradient(90deg, #013FF6, #00e5ff)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Centralized Contents */}
        <div className={styles.heroContentStatic}>
          {/* Live beta badge */}
          <div id="hero-badge" className={styles.heroBadge}>
            <span className={styles.badgeDot} />
            Now in Public Beta — Join 5,000+ Security Teams
          </div>

          {/* Title */}
          <h1 id="hero-headline" className={styles.heroHeadline}>
            <span style={{ fontFamily: "'Oddlini', sans-serif", fontWeight: 300, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>AI POWERED</span>
            <span style={{ fontFamily: "'Oddlini', sans-serif", fontWeight: 'bold', display: 'block', textTransform: 'uppercase', letterSpacing: '-0.02em', marginTop: '4px' }}>
              <span className={styles.headlineAccent}> PLATFORM <br /> </span> AGAINST DIGITAL THREATS
            </span>
          </h1>

          {/* Subheadline */}
          <p id="hero-sub" className={styles.heroSub}>
            Saferest.ai continuously monitors your digital footprint, maps exposed ports, and deploys intelligent ML threat analysis to protect your endpoints 24/7/365.
          </p>

          {/* Actions */}
          <div id="hero-cta" className={styles.heroCta}>
            <Link to="/register" className={styles.btnPrimary}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Start Scanning
            </Link>
            <a href="#demo" className={styles.btnSecondary}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M6.5 5.5l4 2.5-4 2.5V5.5z" fill="currentColor" />
              </svg>
              Watch Demo
            </a>
          </div>


        </div>

        {/* Dashboard Preview */}
        <div className={styles.dashboardContainer}>
           <div ref={dashboardTiltRef} className={styles.dashboardTiltWrapper}>
               <div ref={dashboardScrollRef} className={styles.dashboardScrollWrapper}>
                  <div className={styles.dashboardGlass}>
                     <img src={dashboardImg} alt="Platform Dashboard" className={styles.dashboardImg} />
                  </div>
               </div>
           </div>
        </div>

        <div className={styles.bottomAurora} />
      </section>

      {/* Section: How It Works */}
      <section id="features" className={styles.howItWorks}>
        <div className={styles.howItWorksInner}>
          {/* Left Column: Title + Timeline */}
          <div className={styles.timelineColumn}>
            <div className={styles.sectionHeader}>
              <h2>How it works</h2>
              <p>Our process is built to deliver end-to-end protection with precision, ensuring that your business stays secure.</p>
            </div>

            <div className={styles.timelineStepper}>
              {STEPS.map((step, idx) => {
                const isActive = activeStep === idx;
                return (
                  <div
                    key={idx}
                    className={`${styles.timelineItem} ${isActive ? styles.timelineItemActive : ''} timeline-item-el`}
                    onClick={() => setActiveStep(idx)}
                  >
                    <div className={styles.timelineNode}>
                      <span className={styles.timelineNodeInner}>{step.number}</span>
                    </div>
                    <div className={styles.timelineTitle}>{step.title}</div>
                    
                    <div className={styles.timelineContent}>
                      <p className={styles.timelineDescription}>{step.description}</p>
                    </div>

                    <div className={styles.timelinePointer}>
                      <svg width="120" height="24" viewBox="0 0 120 24" fill="none" className={styles.pointerSvg}>
                        <path d="M0,12 L100,12" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                        <path d="M0,12 L100,12" stroke="url(#pointer-grad)" strokeWidth="1.5" strokeDasharray="3 3" />
                        <circle cx="100" cy="12" r="5" fill="#ACEC00" className={styles.pointerOuterDot} />
                        <circle cx="100" cy="12" r="2.5" fill="#fff" />
                        <defs>
                          <linearGradient id="pointer-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                            <stop offset="100%" stopColor="#ACEC00" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Dynamic Isometric Visualization */}
          <div className={styles.visColumn}>
            <div className={styles.isoContainer}>
              {/* Stacked isometric panels */}
              
              {/* Card 1: Assessment (Active: activeStep === 0) */}
              <div className={`${styles.isoCard} ${styles.isoCard1} ${activeStep === 0 ? styles.isoCardActive : ''}`} onClick={() => setActiveStep(0)}>
                <div className={styles.isoCardHeader}>
                  <div className={`${styles.isoCardIcon} ${styles.iconGreen}`}><FiActivity size={18} /></div>
                  <span className={styles.isoCardTitle}>Step 1: Assessment</span>
                </div>
                <div className={styles.isoCardBody}>
                  <div className={styles.radarGrid}>
                    <div className={styles.radarSweep} />
                    <div className={styles.radarPing} style={{ top: '30%', left: '40%' }} />
                    <div className={styles.radarPing} style={{ top: '60%', left: '70%' }} />
                  </div>
                </div>
                <div className={styles.isoCardFooter}>
                  <span className={styles.isoCardSub}>Assets Discovered: 142</span>
                </div>
              </div>

              {/* Card 2: Threat Analysis (Active: activeStep === 1) */}
              <div className={`${styles.isoCard} ${styles.isoCard2} ${activeStep === 1 ? styles.isoCardActive : ''}`} onClick={() => setActiveStep(1)}>
                <div className={styles.isoCardHeader}>
                  <div className={`${styles.isoCardIcon} ${styles.iconRed}`}><FiShield size={18} /></div>
                  <span className={styles.isoCardTitle}>Step 2: Threat Analysis</span>
                </div>
                <div className={styles.isoCardBody}>
                  <div className={styles.threatList}>
                    <div className={styles.threatRow} style={{ color: '#ff6b6b' }}>
                      <span>CVE-2024-3289 (SQLi)</span>
                      <strong>CRITICAL</strong>
                    </div>
                    <div className={styles.threatRow} style={{ color: '#ffb938' }}>
                      <span>Port 22 Exposed (SSH)</span>
                      <strong>HIGH</strong>
                    </div>
                    <div className={styles.threatRow} style={{ opacity: 0.5 }}>
                      <span>False Positive Filtered</span>
                      <span>RESOLVED</span>
                    </div>
                  </div>
                </div>
                <div className={styles.isoCardFooter}>
                  <span className={styles.isoCardSub}>Vulnerabilities Scored</span>
                </div>
              </div>

              {/* Card 3: Planning (Active: activeStep === 2) */}
              <div className={`${styles.isoCard} ${styles.isoCard3} ${activeStep === 2 ? styles.isoCardActive : ''}`} onClick={() => setActiveStep(2)}>
                <div className={styles.isoCardHeader}>
                  <div className={`${styles.isoCardIcon} ${styles.iconBlue}`}><FiLock size={18} /></div>
                  <span className={styles.isoCardTitle}>Step 3: Planning</span>
                </div>
                <div className={styles.isoCardBody}>
                  <div className={styles.planningDoc}>
                    <div className={styles.docLines}>
                      <div className={styles.docLine} style={{ width: '80%' }} />
                      <div className={styles.docLine} style={{ width: '95%' }} />
                      <div className={styles.docLine} style={{ width: '70%' }} />
                      <div className={styles.docLine} style={{ width: '85%' }} />
                    </div>
                    <div className={styles.pieStats}>
                      <div className={styles.pieRing} />
                      <div className={styles.pieRing} />
                      <div className={styles.pieRing} />
                    </div>
                  </div>
                </div>
                <div className={styles.isoCardFooter}>
                  <span className={styles.isoCardSub}>Security Strategy Ready</span>
                </div>
              </div>

              {/* Card 4: Implementation (Active: activeStep === 3) */}
              <div className={`${styles.isoCard} ${styles.isoCard4} ${activeStep === 3 ? styles.isoCardActive : ''}`} onClick={() => setActiveStep(3)}>
                <div className={styles.isoCardHeader}>
                  <div className={`${styles.isoCardIcon} ${styles.iconCyan}`}><FiZap size={18} /></div>
                  <span className={styles.isoCardTitle}>Step 4: Implementation</span>
                </div>
                <div className={styles.isoCardBody}>
                  <div className={styles.patchStatus}>
                    <div className={styles.patchBar}>
                      <div className={styles.patchProgress} style={{ width: '100%' }} />
                    </div>
                    <div className={styles.patchBadge}>✓ Secure Gateways Deployed</div>
                  </div>
                </div>
                <div className={styles.isoCardFooter}>
                  <span className={styles.isoCardSub}>Gateways Active</span>
                </div>
              </div>

              {/* Card 5: Optimization (Active: activeStep === 4) */}
              <div className={`${styles.isoCard} ${styles.isoCard5} ${activeStep === 4 ? styles.isoCardActive : ''}`} onClick={() => setActiveStep(4)}>
                <div className={styles.isoCardHeader}>
                  <div className={`${styles.isoCardIcon} ${styles.iconGreen}`}><FiServer size={18} /></div>
                  <span className={styles.isoCardTitle}>Step 5: Optimization</span>
                </div>
                <div className={styles.isoCardBody}>
                  <div className={styles.optimGraph}>
                    <svg viewBox="0 0 100 30" className={styles.sparkGraph}>
                      <path d="M0,20 Q15,10 30,18 T60,5 T90,15 T100,10" fill="none" stroke="#ACEC00" strokeWidth="1.5" />
                      <circle cx="100" cy="10" r="2.5" fill="#ACEC00" />
                    </svg>
                    <div className={styles.optimUptime}>Defensive Posture: 99.9%</div>
                  </div>
                </div>
                <div className={styles.isoCardFooter}>
                  <span className={styles.isoCardSub}>Monitoring Live</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Section: Our Services / Security Arsenal */}
      <section id="services" className={styles.servicesSection}>
        <div className={`${styles.servicesHead} services-head-el`}>
          <div className={styles.servicesBadge}>
            <span className={styles.badgeDot} />
            Enterprise Security Suite
          </div>
          <h2>Our <span className={styles.accent}>Services</span></h2>
          <p>Deploy eight specialized autonomous offensive and defensive intelligence modules to guard your enterprise threat parameters.</p>
        </div>

        <div className={`${styles.servicesGrid} services-grid-el`}>
          {SERVICES.map((srv, idx) => {
            const IconComponent = srv.icon;
            const cardId = `service-card-${srv.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            return (
              <div
                key={idx}
                id={cardId}
                className={`${styles.serviceCard} service-card-el`}
                style={{
                  '--card-accent-color': srv.color,
                  '--card-accent-rgb': srv.rgb
                }}
              >
                <div className={styles.serviceCardGlow} />
                
                <div className={styles.serviceCardHeader}>
                  <div className={styles.serviceIconWrapper}>
                    <IconComponent size={20} />
                  </div>
                  <span className={styles.serviceTag}>{srv.tag}</span>
                </div>

                <div className={styles.serviceCardContent}>
                  <h3>{srv.title}</h3>
                  <p>{srv.description}</p>
                </div>

                <div className={styles.serviceCardFooter}>
                  <span className={styles.serviceStatusText}>Active Engine</span>
                  <div className={styles.serviceStatusBar} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

        {/* Section: Features / Personas */}
        <section id="personas" className={styles.personas}>
          <div className={styles.sectionHead}>
            <h2>Built for <span className={styles.accent}>Security Professionals</span></h2>
            <p>From independent consultants to enterprise AppSec teams.</p>
          </div>
          <div className={styles.personaGrid}>
            <div className={styles.personaCard}>
              <FiServer size={32} color="#ACEC00" />
              <h3>For Security Consultants</h3>
              <ul>
                <li><FiCheck size={14} /> Unlimited workspaces per client</li>
                <li><FiCheck size={14} /> Generate dynamic threat reports</li>
                <li><FiCheck size={14} /> White-labeled vulnerability portals</li>
              </ul>
            </div>
            <div className={styles.personaCard}>
              <FiUsers size={32} color="#013FF6" />
              <h3>For Internal AppSec Teams</h3>
              <ul>
                <li><FiCheck size={14} /> Continuous active recon monitoring</li>
                <li><FiCheck size={14} /> Automated Jira & Slack webhooks</li>
                <li><FiCheck size={14} /> False-positive analysis via LLM</li>
              </ul>
            </div>
            <div className={styles.personaCard}>
              <FiGlobe size={32} color="#00e5ff" />
              <h3>For Developers & MSPs</h3>
              <ul>
                <li><FiCheck size={14} /> Real-time active host tracking</li>
                <li><FiCheck size={14} /> AI-guided vulnerability remediation</li>
                <li><FiCheck size={14} /> Full API scanner integration</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section: Pricing */}
        <section id="pricing" className={styles.pricing}>
          <div className={styles.sectionHead}>
            <h2>Transparent, <span className={styles.accent}>Asset-Based</span> Pricing</h2>
            <p>Pay only for the unique domains and IPs you scan. Unlimited rescans without penalty.</p>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.priceTable}>
              <thead>
                <tr>
                  <th>Features</th>
                  <th>Free</th>
                  <th>Pro</th>
                  <th>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Asset Quota</td>
                  <td>1 Asset</td>
                  <td>10 Assets</td>
                  <td>Unlimited</td>
                </tr>
                <tr>
                  <td>Parallel Scans</td>
                  <td>1</td>
                  <td>5</td>
                  <td>High Priority</td>
                </tr>
                <tr>
                  <td>Scheduled Scans</td>
                  <td>✗</td>
                  <td>Weekly</td>
                  <td>Daily / Custom</td>
                </tr>
                <tr>
                  <td>Vulnerability Engine</td>
                  <td>Basic</td>
                  <td>Full Suite</td>
                  <td>Full Suite + AI</td>
                </tr>
                <tr>
                  <td>API Access</td>
                  <td>✗</td>
                  <td>✓</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>Team Workspaces</td>
                  <td>1</td>
                  <td>3</td>
                  <td>Unlimited</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <p>© 2026 Saferest.ai. All rights reserved. Created with high-end premium cinematic UI.</p>
            <div className={styles.trustFooter}>
              <FiShield size={16} /> ISO 27001 Certified · End-to-End Encrypted
            </div>
          </div>
        </footer>
    </div>
  );
}

'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  Mountain,
  Clock,
  ArrowRight,
  ShieldCheck,
  PhoneCall,
  Calendar,
  FileText,
  Sparkles,
} from 'lucide-react';
import GlassBadge from '@/components/ui/GlassBadge';

export interface CarouselRouteItem {
  kind: 'route';
  id: string;
  name: string;
  region: string;
  maxElevation: number; // in meters, e.g. 5364
  distanceKm: number; // in km, e.g. 130
  durationDays: number; // e.g. 14
  difficulty: 'Moderate' | 'Strenuous' | 'Challenging' | 'Extreme';
  elevationBadge?: string;
  image?: string;
  highlights?: string[];
  slug?: string;
  href?: string;
}

export interface CarouselServiceItem {
  kind: 'service';
  id: string;
  title: string;
  category: string;
  highlightMetric: string; // e.g. "100% IFMGA Sherpa"
  highlightBadge?: string; // synonym for highlightMetric
  badgeVariant?: 'gold' | 'emerald' | 'blue' | 'neutral';
  description: string;
  ctaText?: string;
  ctaHref?: string;
  iconName?: 'Compass' | 'Calendar' | 'ShieldCheck' | 'PhoneCall' | 'FileText' | 'Mountain' | 'Sparkles' | string;
  emergencyHotline?: string;
}

export type CarouselItem = CarouselRouteItem | CarouselServiceItem;

export function isRouteItem(item: unknown): item is CarouselRouteItem {
  if (!item || typeof item !== 'object') return false;
  const it = item as Record<string, unknown>;
  return it.kind === 'route' || ('maxElevation' in it && 'name' in it);
}

export function isServiceItem(item: unknown): item is CarouselServiceItem {
  if (!item || typeof item !== 'object') return false;
  const it = item as Record<string, unknown>;
  return it.kind === 'service' || (('highlightMetric' in it || 'highlightBadge' in it) && 'title' in it);
}

export const DEFAULT_CAROUSEL_ITEMS: CarouselItem[] = [
  {
    kind: 'route',
    id: 'ebc',
    name: 'Everest Base Camp Trek',
    region: 'Everest / Khumbu',
    maxElevation: 5364,
    distanceKm: 130,
    durationDays: 14,
    difficulty: 'Strenuous',
    elevationBadge: '5,364m High Pass',
    href: '/trails/ebc',
  },
  {
    kind: 'service',
    id: 'guided-expeditions',
    title: 'Guided Alpine Expeditions',
    category: 'Elite Guiding',
    highlightMetric: '100% IFMGA Sherpa',
    badgeVariant: 'emerald',
    description: 'Summit pushes and high-altitude col crossings led by certified IFMGA/NNMGA Sherpa masters with redundant oxygen logistics.',
    ctaText: 'View Expeditions',
    ctaHref: '/contact?service=guided-expeditions',
    iconName: 'Compass',
  },
  {
    kind: 'route',
    id: 'annapurna-circuit',
    name: 'Annapurna Circuit & Thorong La',
    region: 'Annapurna Massif',
    maxElevation: 5416,
    distanceKm: 160,
    durationDays: 16,
    difficulty: 'Strenuous',
    elevationBadge: '5,416m Thorong La',
    href: '/trails/annapurna-circuit',
  },
  {
    kind: 'service',
    id: 'heli-rescue',
    title: 'Helicopter Rescue & High-Altitude Evac',
    category: 'Emergency SAR',
    highlightMetric: '24/7 Garmin SAR',
    badgeVariant: 'gold',
    description: 'Immediate high-altitude turbine evacuation above 6,000m with satellite dispatch and direct Kathmandu hospital triage.',
    ctaText: 'Emergency SAR Hotline',
    ctaHref: 'tel:+97714123456',
    emergencyHotline: '+977 1 4123456',
    iconName: 'PhoneCall',
  },
  {
    kind: 'route',
    id: 'manaslu-circuit',
    name: 'Manaslu Circuit Trek',
    region: 'Manaslu Himalaya',
    maxElevation: 5106,
    distanceKm: 177,
    durationDays: 14,
    difficulty: 'Challenging',
    elevationBadge: '5,106m Larkya La',
    href: '/trails/manaslu-circuit',
  },
  {
    kind: 'service',
    id: 'custom-itinerary',
    title: 'Custom 3D Itinerary Planning',
    category: 'Terrain Telemetry',
    highlightMetric: 'Acclimatization Pacing',
    badgeVariant: 'blue',
    description: 'Interactive 3D elevation profiling with waypoint checkpoints, barometric pacing, and custom GPX/KML route studio.',
    ctaText: 'Plan Custom Route',
    ctaHref: '/itinerary/planner',
    iconName: 'Calendar',
  },
  {
    kind: 'route',
    id: 'langtang-valley',
    name: 'Langtang Valley & Kyanjin Ri',
    region: 'Langtang National Park',
    maxElevation: 4773,
    distanceKm: 77,
    durationDays: 8,
    difficulty: 'Moderate',
    elevationBadge: '4,773m Kyanjin Ri',
    href: '/trails/langtang-valley',
  },
  {
    kind: 'service',
    id: 'sherpa-logistics',
    title: 'Sherpa & Porter Logistics',
    category: 'Expedition Support',
    highlightMetric: 'Fair Living Wage',
    badgeVariant: 'gold',
    description: 'Ethical porter operations adhering to IPPG guidelines, gear portage, mountain teahouse reservations, and base camp cooks.',
    ctaText: 'Inquire Logistics',
    ctaHref: '/contact?service=sherpa-logistics',
    iconName: 'ShieldCheck',
  },
  {
    kind: 'route',
    id: 'upper-mustang',
    name: 'Upper Mustang Forbidden Kingdom',
    region: 'Mustang / Trans-Himalaya',
    maxElevation: 3840,
    distanceKm: 125,
    durationDays: 12,
    difficulty: 'Moderate',
    elevationBadge: '3,840m Lo Manthang',
    href: '/trails/upper-mustang',
  },
  {
    kind: 'service',
    id: 'permits-tims',
    title: 'Conservation Permits & TIMS Passes',
    category: 'Alpine Legalities',
    highlightMetric: '100% Legal RAP Permits',
    badgeVariant: 'emerald',
    description: 'Seamless government clearances for Sagarmatha, Annapurna, and restricted zones like Upper Mustang & Manaslu.',
    ctaText: 'Permits Desk',
    ctaHref: '/contact?service=permits',
    iconName: 'FileText',
  },
];

const SPEED_DURATION_MAP: Record<'slow' | 'normal' | 'fast', string> = {
  slow: '75s',
  normal: '45s',
  fast: '25s',
};

export interface CarouselCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  isHovered?: boolean;
  isPressed?: boolean;
  isFocusVisible?: boolean;
}

export function CarouselCard({
  children,
  className = '',
  isHovered: isHoveredProp,
  isPressed: isPressedProp,
  isFocusVisible: isFocusVisibleProp,
  ...props
}: CarouselCardProps) {
  const [internalHovered, setInternalHovered] = useState(false);
  const [internalPressed, setInternalPressed] = useState(false);
  const [internalFocusVisible, setInternalFocusVisible] = useState(false);

  const activeHovered = isHoveredProp !== undefined ? isHoveredProp : internalHovered;
  const activePressed = isPressedProp !== undefined ? isPressedProp : internalPressed;
  const activeFocusVisible = isFocusVisibleProp !== undefined ? isFocusVisibleProp : internalFocusVisible;

  return (
    <div
      data-slot="card"
      data-hovered={activeHovered ? 'true' : 'false'}
      data-pressed={activePressed ? 'true' : 'false'}
      data-focus-visible={activeFocusVisible ? 'true' : 'false'}
      onMouseEnter={(e) => {
        setInternalHovered(true);
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setInternalHovered(false);
        props.onMouseLeave?.(e);
      }}
      onMouseDown={(e) => {
        setInternalPressed(true);
        props.onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        setInternalPressed(false);
        props.onMouseUp?.(e);
      }}
      onFocus={(e) => {
        setInternalFocusVisible(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setInternalFocusVisible(false);
        setInternalPressed(false);
        props.onBlur?.(e);
      }}
      className={`group/card w-[300px] sm:w-[360px] shrink-0 rounded-3xl backdrop-blur-xl bg-surface/75 border border-border/40 hover:border-accent/60 text-surface-foreground p-5 flex flex-col justify-between transition-all duration-300 shadow-xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CarouselRouteCardProps {
  route: CarouselRouteItem;
  className?: string;
}

export function CarouselRouteCard({ route, className = '' }: CarouselRouteCardProps) {
  const destinationHref = route.href || (route.slug ? `/trails/${route.slug}` : `/trails/${route.id}`);
  const badgeLabel = route.elevationBadge || `${route.maxElevation.toLocaleString()}m High Pass`;

  return (
    <CarouselCard className={className}>
      <div data-slot="header" className="flex items-center justify-between pb-3 border-b border-border/30">
        <span
          data-slot="description"
          className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
        >
          {route.region}
        </span>
        <GlassBadge variant="gold">{badgeLabel}</GlassBadge>
      </div>

      <div data-slot="body" className="py-4 flex-1">
        <h3
          data-slot="label"
          className="text-lg font-bold text-foreground group-hover/card:text-accent transition-colors line-clamp-1"
        >
          {route.name}
        </h3>

        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/20 text-muted-foreground">
          <div className="flex flex-col items-start gap-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1">
              <Mountain className="w-3 h-3 text-accent shrink-0" />
              Alt
            </span>
            <span className="text-xs font-bold text-foreground">
              {route.maxElevation.toLocaleString()}m
            </span>
          </div>

          <div className="flex flex-col items-start gap-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1">
              <Compass className="w-3 h-3 text-accent shrink-0" />
              Dist
            </span>
            <span className="text-xs font-bold text-foreground">
              {route.distanceKm} km
            </span>
          </div>

          <div className="flex flex-col items-start gap-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3 text-accent shrink-0" />
              Time
            </span>
            <span className="text-xs font-bold text-foreground">
              {route.durationDays} Days
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface border border-border/40 text-muted-foreground font-medium">
            {route.difficulty}
          </span>
        </div>
      </div>

      <div data-slot="footer" className="pt-3 border-t border-border/30">
        <Link
          href={destinationHref}
          className="w-full inline-flex items-center justify-between px-4 py-2.5 rounded-xl bg-surface/90 hover:bg-accent hover:text-accent-foreground text-foreground border border-border/40 hover:border-accent font-semibold text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-background"
        >
          <span>View Expedition</span>
          <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover/card:translate-x-1" />
        </Link>
      </div>
    </CarouselCard>
  );
}

export interface CarouselServiceCardProps {
  service: CarouselServiceItem;
  className?: string;
}

export function CarouselServiceCard({ service, className = '' }: CarouselServiceCardProps) {
  const metric = service.highlightMetric || service.highlightBadge || '';
  const ctaHref = service.ctaHref || `/contact?service=${service.id}`;
  const ctaText = service.ctaText || 'Book / Inquire';

  const renderIcon = () => {
    switch (service.iconName) {
      case 'PhoneCall':
        return <PhoneCall className="w-5 h-5" />;
      case 'Calendar':
        return <Calendar className="w-5 h-5" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5" />;
      case 'FileText':
        return <FileText className="w-5 h-5" />;
      case 'Mountain':
        return <Mountain className="w-5 h-5" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'Compass':
      default:
        return <Compass className="w-5 h-5" />;
    }
  };

  return (
    <CarouselCard className={className}>
      <div data-slot="header" className="flex items-center justify-between pb-3 border-b border-border/30">
        <span
          data-slot="description"
          className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
        >
          {service.category}
        </span>
        <GlassBadge variant={service.badgeVariant || 'emerald'}>{metric}</GlassBadge>
      </div>

      <div data-slot="body" className="py-4 flex-1">
        <div
          data-slot="indicator"
          className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/30 text-accent flex items-center justify-center mb-3"
        >
          {renderIcon()}
        </div>

        <h3
          data-slot="label"
          className="text-lg font-bold text-foreground group-hover/card:text-accent transition-colors line-clamp-1"
        >
          {service.title}
        </h3>

        <p data-slot="description" className="text-xs text-muted-foreground line-clamp-3 mt-2 leading-relaxed">
          {service.description}
        </p>

        {service.emergencyHotline && (
          <div className="mt-3 flex items-center gap-1.5 text-xs font-mono text-accent">
            <PhoneCall className="w-3.5 h-3.5" />
            <span>{service.emergencyHotline}</span>
          </div>
        )}
      </div>

      <div data-slot="footer" className="pt-3 border-t border-border/30">
        <Link
          href={ctaHref}
          className="w-full inline-flex items-center justify-between px-4 py-2.5 rounded-xl bg-surface/90 hover:bg-accent hover:text-accent-foreground text-foreground border border-border/40 hover:border-accent font-semibold text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-background"
        >
          <span>{ctaText}</span>
          {service.iconName === 'PhoneCall' ? (
            <PhoneCall className="w-4 h-4 ml-1" />
          ) : (
            <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover/card:translate-x-1" />
          )}
        </Link>
      </div>
    </CarouselCard>
  );
}

export interface CarouselTrackProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  ariaHidden?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function CarouselTrack({
  children,
  ariaHidden = false,
  className = '',
  style,
  ...props
}: CarouselTrackProps) {
  return (
    <div
      data-slot="track"
      aria-hidden={ariaHidden ? 'true' : undefined}
      className={`flex shrink-0 items-stretch gap-6 pr-6 will-change-transform ${className}`}
      style={{
        transform: 'translate3d(0, 0, 0)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export interface InfiniteCarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: CarouselItem[];
  speed?: 'slow' | 'normal' | 'fast';
  direction?: 'left' | 'right';
  pauseOnHover?: boolean;
  pauseOnTouch?: boolean;
  className?: string;
  trackClassName?: string;
  gradientEdge?: boolean;
  renderItem?: (item: CarouselItem, index: number) => React.ReactNode;
  children?: React.ReactNode;
}

export default function InfiniteCarousel({
  items = DEFAULT_CAROUSEL_ITEMS,
  speed = 'normal',
  direction = 'left',
  pauseOnHover = true,
  pauseOnTouch = true,
  className = '',
  trackClassName = '',
  gradientEdge = true,
  renderItem,
  children,
  ...props
}: InfiniteCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const duration = SPEED_DURATION_MAP[speed] || '45s';

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (pauseOnHover) setIsHovered(true);
    props.onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (pauseOnHover) setIsHovered(false);
    props.onMouseLeave?.(e);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (pauseOnTouch) setIsPressed(true);
    props.onTouchStart?.(e);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (pauseOnTouch) setIsPressed(false);
    props.onTouchEnd?.(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  const isPaused = (pauseOnHover && isHovered) || (pauseOnTouch && isPressed) || isFocused;

  const animationClass =
    direction === 'right' ? 'animate-marquee-right' : 'animate-marquee-left';

  const trackAnimationStyles: React.CSSProperties = {
    animationDuration: duration,
    animationPlayState: isPaused ? 'paused' : 'running',
    willChange: 'transform',
    transform: 'translate3d(0, 0, 0)',
  };

  // Render content items
  const renderContent = () => {
    if (children) {
      return children;
    }

    return items.map((item, index) => {
      if (renderItem) {
        return (
          <React.Fragment key={item.id || index}>
            {renderItem(item, index)}
          </React.Fragment>
        );
      }

      if (isRouteItem(item)) {
        return <CarouselRouteCard key={item.id || index} route={item} />;
      }

      if (isServiceItem(item)) {
        return <CarouselServiceCard key={item.id || index} service={item} />;
      }

      return null;
    });
  };

  const renderedContent = renderContent();

  return (
    <div
      ref={containerRef}
      data-slot="base"
      data-direction={direction}
      data-speed={speed}
      data-hovered={isHovered ? 'true' : 'false'}
      data-pressed={isPressed ? 'true' : 'false'}
      data-paused={isPaused ? 'true' : 'false'}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={`group relative w-full overflow-hidden select-none py-4 ${className}`}
      {...props}
    >
      {/* Edge gradient masks for smooth fade-in and fade-out */}
      {gradientEdge && (
        <>
          <div
            data-slot="gradient-left"
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-24 z-20 bg-gradient-to-r from-background to-transparent"
          />
          <div
            data-slot="gradient-right"
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-24 z-20 bg-gradient-to-l from-background to-transparent"
          />
        </>
      )}

      {/* Dual Mirrored Content Tracks (Track 1 + Track 2 aria-hidden="true") */}
      <div
        className="flex flex-nowrap w-max"
        style={{
          '--marquee-duration': duration,
        } as React.CSSProperties}
      >
        <CarouselTrack
          className={`${animationClass} ${trackClassName}`}
          style={trackAnimationStyles}
        >
          {renderedContent}
        </CarouselTrack>

        <CarouselTrack
          ariaHidden={true}
          className={`${animationClass} ${trackClassName}`}
          style={trackAnimationStyles}
        >
          {renderedContent}
        </CarouselTrack>
      </div>
    </div>
  );
}

// Compound component attachments
InfiniteCarousel.Track = CarouselTrack;
InfiniteCarousel.Card = CarouselCard;
InfiniteCarousel.RouteCard = CarouselRouteCard;
InfiniteCarousel.ServiceCard = CarouselServiceCard;

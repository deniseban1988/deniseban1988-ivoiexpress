import React, { useState, useEffect } from 'react';
import { SystemConfigEngine } from '../../core/domain/governance/SystemConfigEngine';
import { DEFAULT_WELCOME_BUS_HOSTESS_IMAGE } from '../../assets/welcomeAssets';
import { 
  Check, 
  AlertCircle, 
  Info, 
  X, 
  QrCode, 
  ChevronRight, 
  Search, 
  Loader2, 
  ShieldCheck, 
  ArrowUpRight, 
  TrendingUp,
  SlidersHorizontal,
  Copy,
  Bell,
  Menu,
  Bus,
  Hotel,
  Eye,
  Tv,
  Home,
  User,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Settings
} from 'lucide-react';

/* ==========================================
   1. BUTTON COMPONENT (Design System Officiel IVOIReXpress)
   ========================================== */
export interface IxButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'disabled' | 'outline' | 'ghost' | 'success' | 'danger' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ElementType;
  fullWidth?: boolean;
}

export const IxButton: React.FC<IxButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon: Icon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  // Border radius 14px as per official IVOIReXpress specs
  const baseStyle = "font-semibold rounded-[14px] inline-flex items-center justify-center space-x-2 transition-all duration-200 active:scale-[0.98] shadow-sm";
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs font-semibold",
    md: "px-4 py-2.5 text-sm font-semibold",
    lg: "px-6 py-3.5 text-base font-semibold"
  };

  const variantStyles = {
    // Primaire: Fond bleu foncé #0F4C81, Texte blanc, Coins 14px
    primary: "bg-[#0F4C81] hover:bg-[#0C3D68] text-white shadow-[#0F4C81]/20 font-semibold border border-transparent",
    // Secondaire: Fond blanc #FFFFFF, Bordure bleue #0F4C81, Texte bleu #0F4C81
    secondary: "bg-white hover:bg-blue-50/80 text-[#0F4C81] border-2 border-[#0F4C81] font-semibold",
    // Désactivé: Fond gris clair, Texte gris, Aucun effet interactif
    disabled: "bg-[#EEF2F7] text-[#6B7280] border border-[#D1D5DB] cursor-not-allowed shadow-none active:scale-100",
    outline: "bg-transparent hover:bg-slate-100 text-[#1F2937] border border-[#D1D5DB]",
    ghost: "bg-transparent hover:bg-slate-100 text-[#0F4C81] border-none shadow-none",
    success: "bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold shadow-emerald-600/20",
    danger: "bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold shadow-rose-600/20",
    amber: "bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-amber-400/20"
  };

  const isActuallyDisabled = disabled || variant === 'disabled';

  return (
    <button
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[isActuallyDisabled ? 'disabled' : variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={isActuallyDisabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 text-current shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
};

/* ==========================================
   2. FORM INPUT COMPONENT (Design System Officiel)
   ========================================== */
export interface IxInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  leftIcon?: React.ElementType;
  rightIcon?: React.ElementType;
  onRightIconClick?: () => void;
  state?: 'default' | 'success' | 'error';
  errorMessage?: string;
  successMessage?: string;
}

export const IxInput: React.FC<IxInputProps> = ({
  label,
  helperText,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  onRightIconClick,
  state = 'default',
  errorMessage,
  successMessage,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? `ivx-input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  const stateStyles = {
    default: "border-[#D1D5DB] focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/20",
    success: "border-[#16A34A] text-[#1F2937] focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20",
    error: "border-[#DC2626] text-[#1F2937] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"
  };

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="block text-[13px] font-medium text-[#1F2937]">
          {label}
        </label>
      )}

      <div className="relative rounded-[12px]">
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B7280]">
            <LeftIcon className="w-4 h-4" />
          </div>
        )}

        <input
          id={inputId}
          className={`w-full bg-white text-[#1F2937] text-sm py-2.5 rounded-[12px] border transition-all duration-150 outline-none placeholder-[#6B7280]/70 ${
            LeftIcon ? 'pl-10' : 'pl-3.5'
          } ${RightIcon ? 'pr-10' : 'pr-3.5'} ${stateStyles[state]} ${className}`}
          {...props}
        />

        {RightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#6B7280] hover:text-[#1F2937]"
          >
            <RightIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Helper text or validation messages */}
      {state === 'error' && errorMessage ? (
        <p className="text-[12px] text-[#DC2626] flex items-center space-x-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </p>
      ) : state === 'success' && successMessage ? (
        <p className="text-[12px] text-[#16A34A] flex items-center space-x-1 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{successMessage}</span>
        </p>
      ) : helperText ? (
        <p className="text-[12px] text-[#6B7280]">{helperText}</p>
      ) : null}
    </div>
  );
};

/* ==========================================
   3. CARD COMPONENT (Design System Officiel)
   ========================================== */
export interface IxCardProps {
  children?: React.ReactNode;
  title?: string;
  description?: string;
  icon?: React.ElementType;
  indicator?: React.ReactNode;
  imageUrl?: string;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  hoverable?: boolean;
  layout?: 'standard' | 'horizontal';
  accentColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'amber' | 'emerald' | 'blue' | 'purple' | 'rose' | 'none';
}

export const IxCard: React.FC<IxCardProps> = ({
  children,
  title,
  description,
  icon: Icon,
  indicator,
  imageUrl,
  className = '',
  header,
  footer,
  hoverable = true,
  layout = 'standard',
  accentColor = 'none'
}) => {
  const accentBorders = {
    none: 'border-[#D1D5DB]/80',
    primary: 'border-l-4 border-l-[#0F4C81] border-y border-r border-[#D1D5DB]',
    secondary: 'border-l-4 border-l-[#2F80ED] border-y border-r border-[#D1D5DB]',
    success: 'border-l-4 border-l-[#16A34A] border-y border-r border-[#D1D5DB]',
    warning: 'border-l-4 border-l-[#F59E0B] border-y border-r border-[#D1D5DB]',
    danger: 'border-l-4 border-l-[#DC2626] border-y border-r border-[#D1D5DB]',
    amber: 'border-l-4 border-l-amber-500 border-y border-r border-[#D1D5DB]',
    emerald: 'border-l-4 border-l-emerald-500 border-y border-r border-[#D1D5DB]',
    blue: 'border-l-4 border-l-blue-500 border-y border-r border-[#D1D5DB]',
    purple: 'border-l-4 border-l-purple-500 border-y border-r border-[#D1D5DB]',
    rose: 'border-l-4 border-l-rose-500 border-y border-r border-[#D1D5DB]'
  };

  return (
    <div 
      className={`bg-white rounded-[18px] border shadow-[0_8px_24px_-4px_rgba(0,0,0,0.22),0_3px_8px_-2px_rgba(0,0,0,0.14)] overflow-hidden transition-all duration-200 ${
        accentBorders[accentColor]
      } ${hoverable ? 'hover:shadow-[0_18px_36px_-6px_rgba(0,0,0,0.32),0_6px_14px_-3px_rgba(0,0,0,0.20)] hover:-translate-y-0.5' : ''} ${className}`}
    >
      {/* Header section if provided */}
      {header && (
        <div className="px-5 py-3.5 border-b border-[#D1D5DB]/60 bg-[#EEF2F7]/40 flex items-center justify-between">
          {header}
        </div>
      )}

      <div className={`p-5 sm:p-6 ${layout === 'horizontal' ? 'flex flex-col md:flex-row md:items-center md:justify-between gap-5' : 'space-y-4'}`}>
        
        {/* Horizontal Layout Left side or Image */}
        {imageUrl ? (
          <div className={`${layout === 'horizontal' ? 'w-full md:w-48 h-36 shrink-0' : 'w-full h-44'} rounded-[12px] overflow-hidden bg-slate-100 relative`}>
            <img
              src={imageUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80'}
              alt={title || 'Image'}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80';
              }}
            />
          </div>
        ) : null}

        <div className="flex-1 space-y-2">
          {/* Title & Icon Header */}
          {(title || Icon || indicator) && (
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                {Icon && (
                  <div className="w-9 h-9 rounded-[12px] bg-[#EFF6FF] text-[#0F4C81] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                )}
                {title && (
                  <div>
                    <h3 className="text-[18px] font-semibold text-[#1F2937] leading-tight">{title}</h3>
                    {description && <p className="text-[14px] text-[#6B7280] mt-0.5">{description}</p>}
                  </div>
                )}
              </div>
              {indicator && <div className="shrink-0">{indicator}</div>}
            </div>
          )}

          {/* Children body content */}
          {children}
        </div>

      </div>

      {/* Footer section if provided */}
      {footer && (
        <div className="px-5 py-3 border-t border-[#D1D5DB]/60 bg-[#F8FAFC]">
          {footer}
        </div>
      )}
    </div>
  );
};

/* ==========================================
   4. BADGE COMPONENT (Design System Officiel)
   ========================================== */
export interface IxBadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'slate' | 'amber' | 'emerald' | 'blue' | 'purple' | 'rose' | 'orange';
  size?: 'sm' | 'md';
  icon?: React.ElementType;
}

export const IxBadge: React.FC<IxBadgeProps> = ({
  children,
  variant = 'info',
  size = 'md',
  icon: Icon
}) => {
  const variantStyles = {
    // Vert : actif, confirmé
    success: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]',
    emerald: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]',
    // Orange : en attente
    warning: 'bg-[#FFFBEB] text-[#F59E0B] border-[#FDE68A]',
    orange: 'bg-[#FFFBEB] text-[#F59E0B] border-[#FDE68A]',
    amber: 'bg-amber-100 text-amber-800 border-amber-300',
    // Rouge : indisponible, erreur
    error: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
    rose: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
    // Bleu : information
    info: 'bg-[#EFF6FF] text-[#2F80ED] border-[#BFDBFE]',
    blue: 'bg-[#EFF6FF] text-[#2F80ED] border-[#BFDBFE]',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    // Primary Bleu Foncé
    primary: 'bg-[#0F4C81]/10 text-[#0F4C81] border-[#0F4C81]/30',
    // Slate Neutral
    slate: 'bg-[#EEF2F7] text-[#1F2937] border-[#D1D5DB]'
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-[12px] px-2.5 py-1 font-semibold'
  };

  return (
    <span className={`inline-flex items-center space-x-1.5 rounded-full border ${variantStyles[variant]} ${sizes[size]}`}>
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </span>
  );
};

/* ==========================================
   5. HEADER COMPONENT (En-tête Officiel IVOIReXpress)
   ========================================== */
export interface IxHeaderProps {
  pageTitle?: string;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onToggleMobileMenu?: () => void;
  unreadCount?: number;
  userAvatar?: string;
  userName?: string;
}

export const IxHeader: React.FC<IxHeaderProps> = ({
  pageTitle = "Accueil & Navigation",
  searchQuery = "",
  onSearchChange,
  onToggleMobileMenu,
  unreadCount = 2,
  userAvatar,
  userName = "Utilisateur"
}) => {
  return (
    <header className="ivx-header-gradient text-white h-16 px-4 sm:px-6 flex items-center justify-between shadow-md sticky top-0 z-40">
      {/* Left: Brand & Title */}
      <div className="flex items-center space-x-4">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="p-2 rounded-[12px] bg-white/10 hover:bg-white/20 text-white md:hidden transition"
            title="Menu Mobile"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-[12px] bg-white text-[#0F4C81] flex items-center justify-center font-black text-lg shadow-sm">
            IX
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">IVOIReXpress</h1>
            <p className="text-[11px] text-[#56CCF2] font-medium hidden sm:block">{pageTitle}</p>
          </div>
        </div>
      </div>

      {/* Center: Search Field */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-white/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher trajet, hôtel, vision ou IPTV..."
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full bg-white/15 text-white placeholder-white/70 text-xs pl-10 pr-4 py-2 rounded-[12px] border border-white/20 focus:outline-none focus:bg-white/25 transition"
          />
        </div>
      </div>

      {/* Right: Notifications & User profile */}
      <div className="flex items-center space-x-3">
        <button className="relative p-2 rounded-[12px] bg-white/10 hover:bg-white/20 text-white transition">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#F59E0B] rounded-full ring-2 ring-[#0F4C81]" />
          )}
        </button>

        <div className="flex items-center space-x-2 pl-2 border-l border-white/20">
          <div className="w-8 h-8 rounded-[12px] bg-[#56CCF2] text-[#0F4C81] flex items-center justify-center font-bold text-xs uppercase shadow-sm">
            {userName.substring(0, 2)}
          </div>
          <span className="text-xs font-semibold text-white hidden sm:inline">{userName}</span>
        </div>
      </div>
    </header>
  );
};

/* ==========================================
   6. BOTTOM NAVIGATION BAR COMPONENT (Mobile)
   ========================================== */
export interface IxBottomNavProps {
  activeModule: 'home' | 'transport' | 'hotels' | 'vision' | 'iptv';
  onModuleSelect: (mod: 'home' | 'transport' | 'hotels' | 'vision' | 'iptv') => void;
}

export const IxBottomNav: React.FC<IxBottomNavProps> = ({
  activeModule,
  onModuleSelect
}) => {
  const items = [
    { id: 'home', label: 'Accueil', icon: Home },
    { id: 'transport', label: 'Transport', icon: Bus },
    { id: 'hotels', label: 'Hôtels', icon: Hotel },
    { id: 'vision', label: 'Vision', icon: Eye },
    { id: 'iptv', label: 'IPTV', icon: Tv },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#D1D5DB] px-3 py-2 flex items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.05)] md:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeModule === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onModuleSelect(item.id as any)}
            className={`flex flex-col items-center space-y-1 px-3 py-1 rounded-[12px] transition-all ${
              isActive ? 'text-[#0F4C81] font-semibold scale-105' : 'text-[#6B7280]'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-[#0F4C81]' : 'text-[#6B7280]'}`} />
            <span className="text-[11px] leading-none">{item.label}</span>
            {isActive && <div className="w-1.5 h-1.5 bg-[#0F4C81] rounded-full mt-0.5" />}
          </button>
        );
      })}
    </nav>
  );
};

/* ==========================================
   7. STAT CARD COMPONENT
   ========================================== */
export interface IxStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  trendUp?: boolean;
  icon: React.ElementType;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'amber' | 'emerald' | 'blue' | 'purple' | 'rose';
  onClick?: () => void;
}

export const IxStatCard: React.FC<IxStatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendUp = true,
  icon: Icon,
  color = 'primary',
  onClick
}) => {
  const colorSchemes = {
    primary: { bg: 'bg-[#EFF6FF]', text: 'text-[#0F4C81]', border: 'border-[#BFDBFE]' },
    blue: { bg: 'bg-[#EFF6FF]', text: 'text-[#0F4C81]', border: 'border-[#BFDBFE]' },
    success: { bg: 'bg-[#F0FDF4]', text: 'text-[#16A34A]', border: 'border-[#BBF7D0]' },
    emerald: { bg: 'bg-[#F0FDF4]', text: 'text-[#16A34A]', border: 'border-[#BBF7D0]' },
    warning: { bg: 'bg-[#FFFBEB]', text: 'text-[#F59E0B]', border: 'border-[#FDE68A]' },
    amber: { bg: 'bg-[#FFFBEB]', text: 'text-[#F59E0B]', border: 'border-[#FDE68A]' },
    danger: { bg: 'bg-[#FEF2F2]', text: 'text-[#DC2626]', border: 'border-[#FECACA]' },
    rose: { bg: 'bg-[#FEF2F2]', text: 'text-[#DC2626]', border: 'border-[#FECACA]' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' }
  };

  const scheme = colorSchemes[color] || colorSchemes.primary;

  return (
    <div 
      onClick={onClick}
      className={`bg-white border border-[#D1D5DB]/80 rounded-[18px] p-5 shadow-[0_8px_22px_-4px_rgba(0,0,0,0.18),0_2px_6px_-1px_rgba(0,0,0,0.12)] transition-all ${onClick ? 'cursor-pointer hover:shadow-[0_16px_32px_-6px_rgba(0,0,0,0.28),0_6px_14px_-3px_rgba(0,0,0,0.18)] hover:-translate-y-0.5' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[#6B7280]">{title}</span>
        <div className={`w-10 h-10 rounded-[12px] ${scheme.bg} ${scheme.text} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <div className="text-2xl font-bold text-[#1F2937]">{value}</div>
        <div className="flex items-center justify-between text-[13px]">
          {subtitle && <span className="text-[#6B7280]">{subtitle}</span>}
          {trend && (
            <span className={`inline-flex items-center space-x-1 font-semibold ${trendUp ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
              <TrendingUp className={`w-3.5 h-3.5 ${!trendUp && 'rotate-180'}`} />
              <span>{trend}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ==========================================
   8. SKELETON LOADER COMPONENT
   ========================================== */
export const IxSkeletonLoader: React.FC<{ rows?: number; type?: 'card' | 'list' | 'table' }> = ({
  rows = 3,
  type = 'card'
}) => {
  if (type === 'list') {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 bg-[#EEF2F7] rounded-[14px] border border-[#D1D5DB]" />
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="bg-white border border-[#D1D5DB] rounded-[18px] p-4 space-y-3 animate-pulse">
        <div className="h-8 bg-[#EEF2F7] rounded-[12px] w-full" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-10 bg-[#EEF2F7]/60 rounded-[12px] w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-44 bg-white border border-[#D1D5DB] rounded-[18px] p-5 space-y-3">
          <div className="h-4 bg-[#EEF2F7] rounded w-1/3" />
          <div className="h-8 bg-[#EEF2F7] rounded w-2/3" />
          <div className="h-10 bg-[#EEF2F7]/50 rounded-[12px]" />
        </div>
      ))}
    </div>
  );
};

/* ==========================================
   9. STEPPER PROGRESS BAR COMPONENT
   ========================================== */
export interface IxStep {
  id: number | string;
  title: string;
  subtitle?: string;
}

export interface IxStepperProps {
  steps: IxStep[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}

export const IxStepper: React.FC<IxStepperProps> = ({
  steps,
  currentStep,
  onStepClick
}) => {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative max-w-4xl mx-auto px-2">
        {/* Background Line */}
        <div className="absolute left-6 right-6 top-5 h-1 bg-[#EEF2F7] -z-0" />
        <div 
          className="absolute left-6 top-5 h-1 bg-[#0F4C81] transition-all duration-300 -z-0"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div
              key={step.id}
              onClick={() => onStepClick && idx <= currentStep && onStepClick(idx)}
              className={`flex flex-col items-center relative z-10 ${onStepClick && idx <= currentStep ? 'cursor-pointer' : ''}`}
            >
              <div
                className={`w-9 h-9 rounded-[12px] flex items-center justify-center font-semibold text-xs transition-all border-2 ${
                  isCompleted
                    ? 'bg-[#16A34A] text-white border-[#16A34A]'
                    : isCurrent
                    ? 'bg-[#0F4C81] text-white border-[#0F4C81] scale-110 shadow-md'
                    : 'bg-white text-[#6B7280] border-[#D1D5DB]'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
              </div>

              <span className={`mt-2 text-[12px] text-center max-w-[80px] sm:max-w-[100px] truncate ${
                isCurrent ? 'text-[#0F4C81] font-semibold' : isCompleted ? 'text-[#1F2937] font-medium' : 'text-[#6B7280]'
              }`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ==========================================
   10. QR CODE CARD COMPONENT
   ========================================== */
export interface IxQRCodeCardProps {
  title: string;
  code: string;
  subtitle?: string;
}

export const IxQRCodeCard: React.FC<IxQRCodeCardProps> = ({
  title,
  code,
  subtitle
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-[#D1D5DB] rounded-[18px] p-5 text-center space-y-4 shadow-[0_4px_16px_rgba(15,76,129,0.05)]">
      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#EFF6FF] text-[#0F4C81] text-xs font-semibold">
        <QrCode className="w-4 h-4" />
        <span>E-Billet Officiel Validé</span>
      </div>

      <div className="bg-[#F8FAFC] p-4 rounded-[14px] inline-block shadow-inner mx-auto border border-[#D1D5DB]">
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(code)}`}
          alt="QR Code Billet"
          className="w-36 h-36 object-contain mx-auto"
        />
      </div>

      <div className="space-y-1">
        <h4 className="font-semibold text-[#1F2937] text-sm">{title}</h4>
        <div className="inline-flex items-center space-x-2 font-mono text-xs text-[#0F4C81] bg-[#EFF6FF] px-3 py-1 rounded-[8px] border border-[#BFDBFE]">
          <span>{code}</span>
          <button onClick={handleCopy} className="hover:text-[#2F80ED]">
            {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        {subtitle && <p className="text-[12px] text-[#6B7280]">{subtitle}</p>}
      </div>
    </div>
  );
};

/* ==========================================
   11. PASTEL SHORTCUT CARDS & COMPACT SERVICE COMPONENTS (Spécification 2026)
   ========================================== */

export type IxPastelModuleType = 'transport' | 'hotels' | 'vision' | 'iptv' | 'assistance' | 'alertes' | 'settings';

export interface IxPastelShortcutCardProps {
  id?: string;
  module: IxPastelModuleType;
  title: string; // 15-17px SemiBold (600)
  subtitle: string; // 12-13px Regular (400), max 1 line
  emoji?: string;
  icon?: React.ElementType;
  badge?: string;
  onClick?: () => void;
  className?: string;
}

export const moduleColorMap: Record<IxPastelModuleType, { bgPastel: string; iconBg: string; textColor: string; borderColor: string }> = {
  transport: { bgPastel: 'bg-[#FFE7D1]', iconBg: 'bg-[#F5821F] text-white', textColor: 'text-[#9A3412]', borderColor: 'border-[#FDBA74]' },
  hotels: { bgPastel: 'bg-[#E9F9EF]', iconBg: 'bg-[#22C55E] text-white', textColor: 'text-[#166534]', borderColor: 'border-[#86EFAC]' },
  vision: { bgPastel: 'bg-[#E7F2FF]', iconBg: 'bg-[#2563EB] text-white', textColor: 'text-[#1E40AF]', borderColor: 'border-[#93C5FD]' },
  iptv: { bgPastel: 'bg-[#F3E8FF]', iconBg: 'bg-[#9333EA] text-white', textColor: 'text-[#6B21A8]', borderColor: 'border-[#D8B4FE]' },
  assistance: { bgPastel: 'bg-[#FFF8D8]', iconBg: 'bg-[#EAB308] text-white', textColor: 'text-[#854D0E]', borderColor: 'border-[#FDE047]' },
  alertes: { bgPastel: 'bg-[#FFE8E8]', iconBg: 'bg-[#EF4444] text-white', textColor: 'text-[#991B1B]', borderColor: 'border-[#FCA5A5]' },
  settings: { bgPastel: 'bg-[#F3F4F6]', iconBg: 'bg-[#4B5563] text-white', textColor: 'text-[#1F2937]', borderColor: 'border-[#E5E7EB]' },
};

export const IxPastelShortcutCard: React.FC<IxPastelShortcutCardProps> = ({
  id,
  module,
  title,
  subtitle,
  emoji,
  icon: Icon,
  badge,
  onClick,
  className = ''
}) => {
  const color = moduleColorMap[module] || moduleColorMap.settings;

  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-white hover:${color.bgPastel}/50 border border-[#D1D5DB] hover:${color.borderColor} rounded-[20px] p-3.5 sm:p-4 flex items-center justify-between gap-2.5 sm:gap-3 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.20),0_3px_8px_-2px_rgba(0,0,0,0.12)] hover:shadow-[0_18px_36px_-6px_rgba(0,0,0,0.32),0_6px_14px_-3px_rgba(0,0,0,0.20)] hover:-translate-y-1 transition-all duration-200 cursor-pointer group select-none relative overflow-hidden w-full ${className}`}
    >
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        {/* Emoji or Icon in 14px rounded box */}
        <div className={`w-11 h-11 rounded-[14px] ${color.bgPastel} flex items-center justify-center shrink-0 border border-black/5 group-hover:scale-110 transition-transform shadow-xs`}>
          {emoji ? (
            <span className="text-2xl leading-none select-none" role="img" aria-label={title}>
              {emoji}
            </span>
          ) : Icon ? (
            <Icon className={`w-5 h-5 ${color.textColor}`} />
          ) : null}
        </div>

        {/* Text Details */}
        <div className="min-w-0 text-left flex-1">
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <h3 className="text-[15px] sm:text-[16px] font-bold text-[#1F2937] group-hover:text-[#F5821F] transition-colors leading-tight whitespace-nowrap">
              {title}
            </h3>
            {badge && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#22C55E]/15 text-[#166534] shrink-0">
                {badge}
              </span>
            )}
          </div>
          <p className="text-[12px] sm:text-[13px] font-normal text-[#6B7280] truncate mt-0.5 leading-snug">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Chevron Right */}
      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#9CA3AF] group-hover:text-[#F5821F] group-hover:translate-x-0.5 transition-all shrink-0" />
    </div>
  );
};

export interface IxIconOnlyShortcutCardProps {
  id?: string;
  module: IxPastelModuleType;
  ariaLabel: string;
  tooltip?: string;
  emoji?: string;
  icon?: React.ElementType;
  onClick?: () => void;
  className?: string;
}

const serviceCardColors: Record<IxPastelModuleType, {
  bgCard: string;
  borderColor: string;
  hoverBorder: string;
  hoverBg: string;
  shadow: string;
  hoverShadow: string;
  focusRing: string;
  textColor: string;
}> = {
  transport: {
    bgCard: 'bg-[#EBF5FF]', // fond bleu très clair / bleu doux
    borderColor: 'border-[#93C5FD]',
    hoverBorder: 'hover:border-[#3B82F6]',
    hoverBg: 'hover:bg-[#DBEAFE]',
    shadow: 'shadow-[0_8px_20px_rgba(0,0,0,0.16),0_2px_6px_rgba(0,0,0,0.10)]',
    hoverShadow: 'hover:shadow-[0_16px_32px_rgba(0,0,0,0.26),0_4px_12px_rgba(0,0,0,0.14)]',
    focusRing: 'focus:ring-[#2563EB]',
    textColor: 'text-[#1D4ED8]'
  },
  hotels: {
    bgCard: 'bg-[#E9F9EF]', // fond vert très clair / vert doux
    borderColor: 'border-[#86EFAC]',
    hoverBorder: 'hover:border-[#22C55E]',
    hoverBg: 'hover:bg-[#DCFCE7]',
    shadow: 'shadow-[0_8px_20px_rgba(0,0,0,0.16),0_2px_6px_rgba(0,0,0,0.10)]',
    hoverShadow: 'hover:shadow-[0_16px_32px_rgba(0,0,0,0.26),0_4px_12px_rgba(0,0,0,0.14)]',
    focusRing: 'focus:ring-[#16A34A]',
    textColor: 'text-[#15803D]'
  },
  vision: {
    bgCard: 'bg-[#F0F7FF]', // fond bleu ciel / bleu-gris doux
    borderColor: 'border-[#7DD3FC]',
    hoverBorder: 'hover:border-[#0EA5E9]',
    hoverBg: 'hover:bg-[#E0F2FE]',
    shadow: 'shadow-[0_8px_20px_rgba(0,0,0,0.16),0_2px_6px_rgba(0,0,0,0.10)]',
    hoverShadow: 'hover:shadow-[0_16px_32px_rgba(0,0,0,0.26),0_4px_12px_rgba(0,0,0,0.14)]',
    focusRing: 'focus:ring-[#0284C7]',
    textColor: 'text-[#0369A1]'
  },
  iptv: {
    bgCard: 'bg-[#F5F3FF]', // fond violet très clair / lavande
    borderColor: 'border-[#C4B5FD]',
    hoverBorder: 'hover:border-[#8B5CF6]',
    hoverBg: 'hover:bg-[#EDE9FE]',
    shadow: 'shadow-[0_8px_20px_rgba(0,0,0,0.16),0_2px_6px_rgba(0,0,0,0.10)]',
    hoverShadow: 'hover:shadow-[0_16px_32px_rgba(0,0,0,0.26),0_4px_12px_rgba(0,0,0,0.14)]',
    focusRing: 'focus:ring-[#9333EA]',
    textColor: 'text-[#7E22CE]'
  },
  assistance: {
    bgCard: 'bg-[#FFFBEB]',
    borderColor: 'border-[#FCD34D]',
    hoverBorder: 'hover:border-[#F59E0B]',
    hoverBg: 'hover:bg-[#FEF3C7]',
    shadow: 'shadow-[0_8px_20px_rgba(0,0,0,0.16),0_2px_6px_rgba(0,0,0,0.10)]',
    hoverShadow: 'hover:shadow-[0_16px_32px_rgba(0,0,0,0.26),0_4px_12px_rgba(0,0,0,0.14)]',
    focusRing: 'focus:ring-[#D97706]',
    textColor: 'text-[#B45309]'
  },
  alertes: {
    bgCard: 'bg-[#FEF2F2]',
    borderColor: 'border-[#FCA5A5]',
    hoverBorder: 'hover:border-[#EF4444]',
    hoverBg: 'hover:bg-[#FEE2E2]',
    shadow: 'shadow-[0_8px_20px_rgba(0,0,0,0.16),0_2px_6px_rgba(0,0,0,0.10)]',
    hoverShadow: 'hover:shadow-[0_16px_32px_rgba(0,0,0,0.26),0_4px_12px_rgba(0,0,0,0.14)]',
    focusRing: 'focus:ring-[#DC2626]',
    textColor: 'text-[#B91C1C]'
  },
  settings: {
    bgCard: 'bg-[#F8FAFC]',
    borderColor: 'border-[#CBD5E1]',
    hoverBorder: 'hover:border-[#64748B]',
    hoverBg: 'hover:bg-[#F1F5F9]',
    shadow: 'shadow-[0_8px_20px_rgba(0,0,0,0.16),0_2px_6px_rgba(0,0,0,0.10)]',
    hoverShadow: 'hover:shadow-[0_16px_32px_rgba(0,0,0,0.26),0_4px_12px_rgba(0,0,0,0.14)]',
    focusRing: 'focus:ring-[#475569]',
    textColor: 'text-[#334155]'
  }
};

export const IxServiceEmojiCard: React.FC<IxIconOnlyShortcutCardProps> = ({
  id,
  module,
  ariaLabel,
  tooltip,
  emoji,
  icon: Icon,
  onClick,
  className = ''
}) => {
  const color = serviceCardColors[module] || serviceCardColors.settings;
  const titleText = tooltip || ariaLabel;

  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      aria-label={ariaLabel}
      title={titleText}
      className={`${color.bgCard} ${color.hoverBg} border ${color.borderColor} ${color.hoverBorder} ${color.shadow} ${color.hoverShadow} ${color.focusRing} rounded-[22px] p-3 sm:p-4 h-24 sm:h-28 flex items-center justify-center relative overflow-hidden group cursor-pointer transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] select-none w-full focus:outline-none focus:ring-2 focus:ring-offset-2 ${className}`}
    >
      {emoji ? (
        <span
          className="text-4xl sm:text-5xl leading-none select-none transform group-hover:scale-110 transition-transform duration-200 filter drop-shadow-xs"
          role="img"
          aria-label={ariaLabel}
        >
          {emoji}
        </span>
      ) : Icon ? (
        <Icon className={`w-9 h-9 sm:w-10 sm:h-10 ${color.textColor} stroke-[2.2] group-hover:scale-110 transition-transform duration-200`} />
      ) : null}

      {/* Invisible text for Screen Readers / Accessibility */}
      <span className="sr-only">{ariaLabel}</span>
    </button>
  );
};

export const IxIconOnlyShortcutCard: React.FC<IxIconOnlyShortcutCardProps> = IxServiceEmojiCard;

/* ==========================================
   12. BANDEAU DE BIENVENUE & PROMOTIONNEL (Spécification 2026)
   ========================================== */

export interface IxWelcomeBannerProps {
  userName?: string;
  subtitle?: string;
  isVerified?: boolean;
  onActionClick?: () => void;
  welcomeImageUrl?: string;
  className?: string;
}

export const IxWelcomeBanner: React.FC<IxWelcomeBannerProps> = ({
  userName = "Voyageur",
  subtitle = "",
  isVerified = true,
  onActionClick,
  welcomeImageUrl,
  className = ""
}) => {
  const [configSettings, setConfigSettings] = useState(() =>
    SystemConfigEngine.getInstance().getSettings()
  );
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const unsubscribe = SystemConfigEngine.getInstance().subscribe(() => {
      setConfigSettings(SystemConfigEngine.getInstance().getSettings());
      setImgError(false);
    });
    return () => unsubscribe();
  }, []);

  const activeImage = welcomeImageUrl || configSettings.uxui.welcomeBannerImageUrl || DEFAULT_WELCOME_BUS_HOSTESS_IMAGE;

  return (
    <div className={`w-full rounded-3xl bg-slate-900 text-white h-[280px] sm:h-[340px] md:h-[400px] relative overflow-hidden border border-slate-300/30 flex flex-col justify-between p-3.5 sm:p-5 md:p-6 ${className}`}>
      {/* Photo Illustration sans filtre sombre - Image nette et très claire */}
      {!imgError && activeImage && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img
            src={activeImage}
            alt="Autocar VIP & Hôtesse IVOIReXpress"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-[82%_15%] sm:object-[78%_15%]"
            onError={() => setImgError(true)}
          />
        </div>
      )}

      {/* Top Section: Petite carte compacte placée tout en haut à gauche */}
      <div className="relative z-20 flex items-start justify-start">
        <div className="inline-flex items-center space-x-2 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-xl border border-white/20 shadow-md">
          <span className="text-xs sm:text-sm font-black text-white tracking-tight">
            Bonjour, {userName} 👋
          </span>
          {isVerified && (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-emerald-500 text-white text-[10px] sm:text-xs font-extrabold shadow-xs">
              <CheckCircle2 className="w-3 h-3" />
              <span>Compte vérifié</span>
            </span>
          )}
        </div>
      </div>

      {/* Bottom Section: Bouton Réserver un voyage */}
      <div className="relative z-20 flex justify-start">
        {onActionClick && (
          <button
            type="button"
            onClick={onActionClick}
            className="inline-flex items-center space-x-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-[#F5821F] hover:bg-[#e07317] active:bg-[#c9620e] text-white font-black text-xs sm:text-sm shadow-xl shadow-black/40 transition-all duration-200 cursor-pointer border border-white/30 hover:scale-105 active:scale-95"
          >
            <Bus className="w-4 h-4 text-white" />
            <span>Réserver un voyage</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        )}
      </div>
    </div>
  );
};

export interface IxPromoBannerProps {
  title?: string;
  description?: string;
  badgeText?: string;
  ctaText?: string;
  onCtaClick?: () => void;
  className?: string;
}

export const IxPromoBanner: React.FC<IxPromoBannerProps> = ({
  title = "Offre Vacances : -20% sur Car + Hôtel !",
  description = "Réservez votre autocar VIP et votre chambre d'hôtel partenaire simultanément.",
  badgeText = "-20% Promo",
  ctaText = "En profiter",
  onCtaClick,
  className = ""
}) => {
  return (
    <div className={`w-full rounded-[20px] bg-[#0F2D52] text-white p-4 sm:p-5 shadow-[0_12px_28px_-4px_rgba(0,0,0,0.55),0_4px_12px_-2px_rgba(0,0,0,0.35)] relative overflow-hidden border border-white/10 ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-[#0F2D52] via-[#0F2D52]/90 to-transparent z-10 pointer-events-none" />
      
      {/* Decorative background circle */}
      <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-[#F5821F]/20 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
        <div className="space-y-1 max-w-lg">
          <div className="flex items-center space-x-2">
            {badgeText && (
              <span className="inline-block px-2 py-0.5 rounded-full bg-[#F5821F] text-white text-[10px] font-bold uppercase tracking-wider">
                {badgeText}
              </span>
            )}
            <h2 className="text-sm sm:text-base font-bold text-white truncate">
              {title}
            </h2>
          </div>
          <p className="text-xs text-slate-300 font-normal line-clamp-1">
            {description}
          </p>
        </div>

        {ctaText && (
          <button
            onClick={onCtaClick}
            className="shrink-0 px-4 py-2 rounded-[12px] bg-[#F5821F] hover:bg-[#e07317] text-white text-xs font-bold shadow-md shadow-black/30 flex items-center space-x-1.5 transition-all active:scale-95"
          >
            <span>{ctaText}</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        )}
      </div>
    </div>
  );
};

/* ==========================================
   13. COMPACT SERVICE CARD & INTERSTITIAL BANNER
   ========================================== */
export interface IxCompactServiceCardProps {
  id: string;
  title: string;
  icon: React.ElementType;
  badge?: {
    label: string;
    variant?: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'amber' | 'emerald' | 'blue' | 'purple' | 'orange' | 'rose' | 'slate';
  };
  iconColor?: string;
  bgColor?: string;
  onClick?: () => void;
  className?: string;
}

export const IxCompactServiceCard: React.FC<IxCompactServiceCardProps> = ({
  title,
  icon: Icon,
  badge,
  iconColor = 'text-[#0F4C81]',
  bgColor = 'bg-[#EFF6FF]',
  onClick,
  className = ''
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-[#D1D5DB] hover:border-[#F5821F]/60 rounded-[18px] p-3 flex flex-col items-center justify-between text-center h-32 shadow-[0_6px_18px_-2px_rgba(0,0,0,0.18),0_2px_6px_-1px_rgba(0,0,0,0.10)] hover:shadow-[0_14px_28px_-4px_rgba(0,0,0,0.28),0_6px_12px_-2px_rgba(0,0,0,0.16)] hover:-translate-y-0.5 transition-all cursor-pointer group w-full ${className}`}
    >
      <div className="w-full flex justify-end h-4">
        {badge ? (
          <IxBadge variant={badge.variant || 'info'} size="sm">
            {badge.label}
          </IxBadge>
        ) : null}
      </div>
      <div className={`w-10 h-10 rounded-[14px] ${bgColor} ${iconColor} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs shadow-black/10`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="w-full px-1">
        <h4 className="text-xs font-semibold text-[#1F2937] group-hover:text-[#F5821F] transition-colors truncate">
          {title}
        </h4>
      </div>
    </div>
  );
};

export interface IxServiceBannerProps {
  category?: string;
  title: string;
  description: string;
  ctaText?: string;
  onCtaClick?: () => void;
  badgeText?: string;
  className?: string;
}

export const IxServiceBanner: React.FC<IxServiceBannerProps> = ({
  category = "Offre Spéciale",
  title = "Pass Vacances CI : -20% sur la réservation combinée Car + Hôtel !",
  description = "Bénéficiez d'une réduction exclusive en réservant simultanément votre trajet autocar et votre séjour en hôtel partenaire.",
  ctaText = "Découvrir l'Offre",
  onCtaClick,
  badgeText = "Promotion Exclusive",
  className = ""
}) => {
  return (
    <div className={`w-full col-span-full my-3 rounded-[24px] bg-[#0F2D52] text-white p-6 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.65),0_6px_16px_-3px_rgba(0,0,0,0.45)] relative overflow-hidden border border-white/10 ${className}`}>
      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-2 max-w-2xl text-left">
          <div className="flex items-center gap-2">
            {badgeText && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#F5821F] text-white text-[11px] font-semibold uppercase">
                {badgeText}
              </span>
            )}
            {category && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-slate-200 text-[11px] font-medium">
                {category}
              </span>
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-300">
            {description}
          </p>
        </div>

        {ctaText && (
          <button
            onClick={onCtaClick}
            className="px-5 py-3 rounded-[16px] bg-[#F5821F] hover:bg-[#e07317] text-white font-semibold text-xs shadow-md flex items-center justify-center space-x-2 transition-all shrink-0"
          >
            <span>{ctaText}</span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}
      </div>
    </div>
  );
};

/* ==========================================
   14. COMPACT SERVICE GRID CONTAINER
   ========================================== */
export interface IxCompactServiceGridProps {
  group1Services: IxCompactServiceCardProps[];
  group2Services?: IxCompactServiceCardProps[];
  banner?: IxServiceBannerProps;
  className?: string;
}

export const IxCompactServiceGrid: React.FC<IxCompactServiceGridProps> = ({
  group1Services,
  group2Services = [],
  banner,
  className = ''
}) => {
  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      
      {/* Group 1 Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
        {group1Services.map((service) => (
          <IxCompactServiceCard key={service.id} {...service} />
        ))}
      </div>

      {/* Full-width Interstitial Banner */}
      {banner && <IxServiceBanner {...banner} />}

      {/* Group 2 Grid */}
      {group2Services.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
          {group2Services.map((service) => (
            <IxCompactServiceCard key={service.id} {...service} />
          ))}
        </div>
      )}

    </div>
  );
};

/* ==========================================
   14. DESIGN SYSTEM SHOWCASE COMPONENT
   ========================================== */
export const IvoirexpressDesignSystemShowcase: React.FC = () => {
  const [demoInputVal, setDemoInputVal] = useState('Jean-Marc Koffi');

  return (
    <div className="bg-[#F8FAFC] min-h-screen p-4 sm:p-8 space-y-10 text-left max-w-6xl mx-auto font-sans">
      
      {/* Title Header */}
      <div className="border-b border-[#D1D5DB] pb-6 space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#EFF6FF] text-[#0F4C81] text-xs font-semibold border border-[#BFDBFE]">
          <Sparkles className="w-4 h-4" />
          <span>Charte Graphique & Spécifications Officielle 2026</span>
        </div>
        <h1 className="text-3xl font-bold text-[#1F2937]">Design System Officiel IVOIReXpress</h1>
        <p className="text-[#6B7280] text-sm max-w-2xl leading-relaxed">
          Bibliothèque de composants centralisée basée sur Tailwind CSS, garantissant la cohérence visuelle sur l'ensemble des modules (Transport, Hôtellerie, Vision IA, IPTV).
        </p>
      </div>

      {/* 1. PALETTE DE COULEURS */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#1F2937]">1. Palette de Couleurs Officielle</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-3.5 bg-[#0F4C81] text-white rounded-[14px] shadow-sm space-y-2">
            <div className="text-xs font-semibold">Primaire</div>
            <div className="text-[11px] opacity-90 font-mono">#0F4C81</div>
            <div className="text-[10px] opacity-75">Bleu foncé (Action)</div>
          </div>

          <div className="p-3.5 bg-[#2F80ED] text-white rounded-[14px] shadow-sm space-y-2">
            <div className="text-xs font-semibold">Secondaire</div>
            <div className="text-[11px] opacity-90 font-mono">#2F80ED</div>
            <div className="text-[10px] opacity-75">Bleu moyen (Liens)</div>
          </div>

          <div className="p-3.5 bg-[#56CCF2] text-[#1F2937] rounded-[14px] shadow-sm space-y-2">
            <div className="text-xs font-semibold">Accent</div>
            <div className="text-[11px] font-mono">#56CCF2</div>
            <div className="text-[10px] opacity-80">Bleu clair (Survols)</div>
          </div>

          <div className="p-3.5 bg-[#F8FAFC] border border-[#D1D5DB] text-[#1F2937] rounded-[14px] shadow-sm space-y-2">
            <div className="text-xs font-semibold">Fond principal</div>
            <div className="text-[11px] font-mono">#F8FAFC</div>
            <div className="text-[10px] text-[#6B7280]">Blanc cassé</div>
          </div>

          <div className="p-3.5 bg-[#EEF2F7] border border-[#D1D5DB] text-[#1F2937] rounded-[14px] shadow-sm space-y-2">
            <div className="text-xs font-semibold">Fond secondaire</div>
            <div className="text-[11px] font-mono">#EEF2F7</div>
            <div className="text-[10px] text-[#6B7280]">Gris très clair</div>
          </div>

          <div className="p-3.5 bg-white border border-[#D1D5DB] text-[#1F2937] rounded-[14px] shadow-sm space-y-2">
            <div className="text-xs font-semibold">Cartes & Modales</div>
            <div className="text-[11px] font-mono">#FFFFFF</div>
            <div className="text-[10px] text-[#6B7280]">Blanc pur</div>
          </div>
        </div>

        {/* State colors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-[#16A34A] text-white rounded-[14px] space-y-1">
            <div className="text-xs font-semibold">Succès (#16A34A)</div>
            <div className="text-[11px]">Validations</div>
          </div>
          <div className="p-3 bg-[#F59E0B] text-white rounded-[14px] space-y-1">
            <div className="text-xs font-semibold">Alerte (#F59E0B)</div>
            <div className="text-[11px]">Notifications</div>
          </div>
          <div className="p-3 bg-[#DC2626] text-white rounded-[14px] space-y-1">
            <div className="text-xs font-semibold">Erreur (#DC2626)</div>
            <div className="text-[11px]">Messages d'erreur</div>
          </div>
          <div className="p-3 bg-[#D1D5DB] text-[#1F2937] rounded-[14px] space-y-1">
            <div className="text-xs font-semibold">Bordures (#D1D5DB)</div>
            <div className="text-[11px]">Contours</div>
          </div>
        </div>
      </section>

      {/* 2. BOUTONS */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#1F2937]">2. Composant Boutons (Inter 16px SemiBold, Radius 14px)</h2>
        <div className="bg-white p-6 rounded-[18px] border border-[#D1D5DB] shadow-sm space-y-5">
          <div className="flex flex-wrap items-center gap-4">
            <IxButton variant="primary">Bouton Primaire</IxButton>
            <IxButton variant="secondary">Bouton Secondaire</IxButton>
            <IxButton variant="disabled">Bouton Désactivé</IxButton>
            <IxButton variant="success" icon={CheckCircle2}>Validation</IxButton>
            <IxButton variant="danger" icon={XCircle}>Supprimer</IxButton>
          </div>

          <div className="pt-4 border-t border-[#D1D5DB]/60 flex items-center space-x-4">
            <span className="text-xs font-medium text-[#6B7280]">Tailles :</span>
            <IxButton size="sm">Petit (32px)</IxButton>
            <IxButton size="md">Standard (40px)</IxButton>
            <IxButton size="lg">Grand (48px)</IxButton>
          </div>
        </div>
      </section>

      {/* 3. CHAMPS DE FORMULAIRE */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#1F2937]">3. Champs de Formulaire (Radius 12px)</h2>
        <div className="bg-white p-6 rounded-[18px] border border-[#D1D5DB] shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
          <IxInput
            label="Nom & Prénoms"
            leftIcon={User}
            placeholder="Ex: Kouassi Jean"
            helperText="Entrez votre nom tel qu'indiqué sur la CNI."
            value={demoInputVal}
            onChange={(e) => setDemoInputVal(e.target.value)}
          />

          <IxInput
            label="Recherche de Trajet"
            leftIcon={Search}
            placeholder="Abidjan -> Bouaké"
            state="success"
            successMessage="3 départs disponibles aujourd'hui !"
          />

          <IxInput
            label="Numéro de Téléphone"
            leftIcon={Info}
            placeholder="+225 07 00 11 22"
            state="error"
            errorMessage="Numéro invalide (format +225 requis)."
          />
        </div>
      </section>

      {/* 4. BADGES */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#1F2937]">4. Badges d'État</h2>
        <div className="bg-white p-6 rounded-[18px] border border-[#D1D5DB] shadow-sm flex flex-wrap items-center gap-4">
          <IxBadge variant="success" icon={CheckCircle2}>Actif / Confirmé (Vert)</IxBadge>
          <IxBadge variant="warning" icon={AlertTriangle}>En attente (Orange)</IxBadge>
          <IxBadge variant="error" icon={XCircle}>Indisponible / Erreur (Rouge)</IxBadge>
          <IxBadge variant="info" icon={Info}>Information (Bleu)</IxBadge>
        </div>
      </section>

      {/* 5. CARTES */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[#1F2937]">5. Cartes de Résultats (Radius 18px)</h2>
        <div className="space-y-4">
          {/* Card Standard Vertical */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <IxCard
              title="Autocar Express UTB-094"
              description="Ligne directe Abidjan (Yopougon) → Yamoussoukro"
              icon={Bus}
              indicator={<IxBadge variant="success">Confirmé</IxBadge>}
              footer={
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6B7280]">Départ: 14h30</span>
                  <span className="font-bold text-[#0F4C81] text-base">7 500 FCFA</span>
                </div>
              }
            >
              <p className="text-xs text-[#6B7280]">
                Autocar Grand Confort climatisé avec Wi-Fi à bord, divertissement IPTV et caméras de sécurité IVOIReXpress Vision IA.
              </p>
            </IxCard>

            <IxCard
              title="Sofitel Hôtel Ivoire"
              description="Cocody, Abidjan • 5 Étoiles"
              icon={Hotel}
              indicator={<IxBadge variant="info">Disponible</IxBadge>}
              footer={
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6B7280]">Chambre Exécutive Vue Lagune</span>
                  <span className="font-bold text-[#0F4C81] text-base">145 000 FCFA / nuit</span>
                </div>
              }
            >
              <p className="text-xs text-[#6B7280]">
                Établissement connecté avec accès IPTV direct, service de navette VIP et check-in autonome par QR code.
              </p>
            </IxCard>
          </div>

          {/* Horizontal Card Layout */}
          <IxCard
            layout="horizontal"
            title="Caméra IVOIReXpress Vision IA - Gare UTB Adjamé"
            description="Flux RTSP / ONVIF Haute Définition avec détection de somnolence et d'intrusion."
            icon={Eye}
            indicator={<IxBadge variant="success">Statut OK • 60 FPS</IxBadge>}
          >
            <div className="flex items-center space-x-3 pt-2">
              <IxButton size="sm" variant="primary">Voir le Flux En Direct</IxButton>
              <IxButton size="sm" variant="secondary">Rapport d'Incident</IxButton>
            </div>
          </IxCard>
        </div>
      </section>

      {/* 6. NOUVELLE DISPOSITION DE CARTES DE SERVICES COMPACTES */}
      <section className="space-y-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
            <span>Spécification UX/UI 2026</span>
          </div>
          <h2 className="text-xl font-semibold text-[#1F2937]">6. Cartes de Raccourcis Pastel & Bannière Officielle</h2>
          <p className="text-xs text-[#6B7280]">
            Aperçu des cartes pastel par module (Orange pour Transport, Vert pour Hôtel, Bleu pour Caméra, Violet pour IPTV, Jaune pour Assistance, Rouge pour Alertes, Gris pour Paramètres).
          </p>
        </div>

        <div className="space-y-6">
          <IxWelcomeBanner
            userName="Prénom"
            subtitle="Bienvenue sur votre portail unifié IVOIReXpress. Sélectionnez un service pour démarrer votre voyage."
            isVerified={true}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <IxPastelShortcutCard
              id="transport"
              module="transport"
              title="Transport"
              subtitle="Billets de bus & départs"
              icon={Bus}
              badge="Actif"
            />
            <IxPastelShortcutCard
              id="hotels"
              module="hotels"
              title="Hôtellerie"
              subtitle="Réservation d'hôtels"
              icon={Hotel}
              badge="5 Étoiles"
            />
            <IxPastelShortcutCard
              id="vision"
              module="vision"
              title="Surveillance Caméra"
              subtitle="Vidéosurveillance IA"
              icon={Eye}
              badge="Direct"
            />
            <IxPastelShortcutCard
              id="iptv"
              module="iptv"
              title="IPTV"
              subtitle="Divertissement VOD"
              icon={Tv}
            />
            <IxPastelShortcutCard
              id="assistance"
              module="assistance"
              title="Assistance IA"
              subtitle="Support usager 24/7"
              icon={HelpCircle}
            />
            <IxPastelShortcutCard
              id="alertes"
              module="alertes"
              title="Alertes Sécurité"
              subtitle="2 notifications"
              icon={Bell}
              badge="Urgent"
            />
            <IxPastelShortcutCard
              id="settings"
              module="settings"
              title="Paramètres"
              subtitle="Gestion du compte"
              icon={Settings}
            />
          </div>

          <IxPromoBanner
            title="Offre Spéciale Vacances CI : -20% sur la formule Car + Hôtel !"
            description="Réservez simultanément votre voyage en autocar VIP et votre chambre d'hôtel partenaire à Yamoussoukro ou San Pédro."
            badgeText="-20% Réduction"
            ctaText="Découvrir l'offre"
          />
        </div>
      </section>

    </div>
  );
};

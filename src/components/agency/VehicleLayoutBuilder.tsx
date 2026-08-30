import React, { useState } from 'react';
import { VehiclePhysicalLayout, VehicleLayoutType, SeatItem } from '../../types/seat3d';
import { MASTER_VEHICLE_LAYOUTS, generateSeatMatrix } from '../../data/transportData';
import { Seat3DRenderer } from '../traveler/Seat3DRenderer';
import { 
  Bus, 
  Layers, 
  Settings, 
  Check, 
  Save, 
  Plus, 
  Sliders, 
  Crown, 
  Accessibility, 
  Ban, 
  Sparkles,
  Shield,
  Eye,
  Trash2,
  Copy
} from 'lucide-react';

interface VehicleLayoutBuilderProps {
  onSaveLayout?: (newLayout: VehiclePhysicalLayout) => void;
  onClose?: () => void;
}

export const VehicleLayoutBuilder: React.FC<VehicleLayoutBuilderProps> = ({
  onSaveLayout,
  onClose
}) => {
  // Preset or custom state
  const [selectedPresetId, setSelectedPresetId] = useState<string>(MASTER_VEHICLE_LAYOUTS[0].id);
  const [layoutName, setLayoutName] = useState<string>('Nouvelle Configuration Autocar VIP');
  const [layoutType, setLayoutType] = useState<VehicleLayoutType>('COACH_2X2');
  const [decksCount, setDecksCount] = useState<1 | 2>(1);
  const [rowsCount, setRowsCount] = useState<number>(8);
  const [colsPattern, setColsPattern] = useState<'2+2' | '2+1' | '1+1'>('2+2');
  
  // Custom features
  const [hasToilet, setHasToilet] = useState<boolean>(true);
  const [hasMiniBar, setHasMiniBar] = useState<boolean>(true);
  const [hasStairs, setHasStairs] = useState<boolean>(false);
  const [hasMiddleDoor, setHasMiddleDoor] = useState<boolean>(true);
  
  // Custom seat flags
  const [vipRows, setVipRows] = useState<number[]>([1, 2]);
  const [pmrRows, setPmrRows] = useState<number[]>([1]);
  const [blockedSeats, setBlockedSeats] = useState<number[]>([]);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Generate dynamic preview layout
  const currentLayout: VehiclePhysicalLayout = React.useMemo(() => {
    if (decksCount === 2) {
      const lower = generateSeatMatrix(4, '2+2', 1, 1, {
        vipRows: [1, 2, 3, 4],
        pmrRows: [1],
        hasToiletAtRear: hasToilet,
        blockedSeatNums: blockedSeats
      });
      const upper = generateSeatMatrix(Math.max(rowsCount, 6), '2+2', 2, lower.seats.length + 1, {
        vipRows: [1],
        blockedSeatNums: blockedSeats
      });
      return {
        id: `custom-${Date.now()}`,
        name: layoutName,
        code: `LAYOUT-${layoutType}-${Date.now().toString(36).toUpperCase()}`,
        type: 'DOUBLE_DECK',
        decksCount: 2,
        rowsCount: Math.max(rowsCount, 8),
        columnsCount: 5,
        aisleColumnIndex: 2,
        totalSeats: lower.totalSeats + upper.totalSeats,
        seats: [...lower.seats, ...upper.seats],
        features: {
          hasFrontDoor: true,
          hasMiddleDoor: hasMiddleDoor,
          hasRearDoor: false,
          hasDriverCabin: true,
          hasToilet,
          hasStairs: true,
          hasLuggageCompartment: true,
          hasMiniBar
        },
        description: `Configuration à 2 niveaux (${lower.totalSeats + upper.totalSeats} places) avec salon VIP inférieur et pont panoramique.`,
        recommendedFor: 'Grandes lignes nationales (Abidjan - Bouaké - Korhogo)'
      };
    }

    const matrix = generateSeatMatrix(rowsCount, colsPattern, 1, 1, {
      pmrRows,
      vipRows,
      hasToiletAtRear: hasToilet,
      blockedSeatNums: blockedSeats
    });

    return {
      id: `custom-${Date.now()}`,
      name: layoutName,
      code: `LAYOUT-${colsPattern.replace('+', 'X')}-${rowsCount}`,
      type: layoutType,
      decksCount: 1,
      rowsCount,
      columnsCount: matrix.columnsCount,
      aisleColumnIndex: matrix.aisleCol,
      totalSeats: matrix.totalSeats,
      seats: matrix.seats,
      features: {
        hasFrontDoor: true,
        hasMiddleDoor,
        hasRearDoor: colsPattern === '1+1',
        hasDriverCabin: true,
        hasToilet,
        hasLuggageCompartment: true,
        hasMiniBar
      },
      description: `Configuration ${colsPattern} avec ${matrix.totalSeats} sièges ergonomiques et espace confort.`,
      recommendedFor: colsPattern === '2+1' ? 'Liaisons Business & VIP' : 'Liaisons régulières Express'
    };
  }, [layoutName, layoutType, decksCount, rowsCount, colsPattern, hasToilet, hasMiniBar, hasMiddleDoor, vipRows, pmrRows, blockedSeats]);

  const handleApplyPreset = (preset: VehiclePhysicalLayout) => {
    setSelectedPresetId(preset.id);
    setLayoutName(preset.name);
    setLayoutType(preset.type);
    setDecksCount(preset.decksCount);
    setRowsCount(preset.rowsCount);
    setHasToilet(preset.features.hasToilet);
    setHasMiniBar(preset.features.hasMiniBar || false);
    setHasStairs(preset.features.hasStairs || false);
    setHasMiddleDoor(preset.features.hasMiddleDoor);
    
    if (preset.type === 'COACH_2X1') {
      setColsPattern('2+1');
    } else if (preset.type === 'COACH_1X1') {
      setColsPattern('1+1');
    } else {
      setColsPattern('2+2');
    }
  };

  const handleSave = () => {
    if (onSaveLayout) {
      onSaveLayout(currentLayout);
    }
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      if (onClose) onClose();
    }, 1500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 text-white space-y-6 shadow-2xl">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Sliders className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-extrabold mb-1">
              <Bus className="w-3 h-3" />
              <span>Aménagement des Autocars</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Configurateur de Plans & Sièges 3D
            </h2>
            <p className="text-xs text-slate-400">
              Définissez la disposition physique exacte de vos autocars, rangées, ponts et zones réservées.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              Fermer
            </button>
          )}
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs shadow-lg shadow-orange-500/30 transition-all flex items-center space-x-2"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Plan Enregistré !</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-white" />
                <span>Enregistrer la Configuration</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Presets Quick Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Modèles Prédéfinis & Véhicules Homologués
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {MASTER_VEHICLE_LAYOUTS.map(preset => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              className={`p-3 rounded-2xl border text-left transition-all relative ${
                selectedPresetId === preset.id
                  ? 'bg-orange-500/20 border-orange-500 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black truncate">{preset.name}</span>
                <span className="text-[10px] font-mono font-bold text-orange-400">
                  {preset.totalSeats} pl.
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Two Column Configuration Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
          <h3 className="text-xs font-black text-orange-400 uppercase tracking-wider flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Paramètres Structurels du Véhicule</span>
          </h3>

          {/* Layout Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Nom du Modèle / Flotte</label>
            <input
              type="text"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Decks & Layout Pattern */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Nombre d'Étages</label>
              <select
                value={decksCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) as 1 | 2;
                  setDecksCount(val);
                  if (val === 2) setLayoutType('DOUBLE_DECK');
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-500"
              >
                <option value={1}>1 Niveau (Standard)</option>
                <option value={2}>2 Niveaux (Double Deck)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Disposition Sièges</label>
              <select
                value={colsPattern}
                onChange={(e) => {
                  const val = e.target.value as '2+2' | '2+1' | '1+1';
                  setColsPattern(val);
                  if (val === '2+1') setLayoutType('COACH_2X1');
                  else if (val === '1+1') setLayoutType('COACH_1X1');
                  else setLayoutType('COACH_2X2');
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-500"
              >
                <option value="2+2">2 + 2 (4 par rangée)</option>
                <option value="2+1">2 + 1 (Première Classe VIP)</option>
                <option value="1+1">1 + 1 (Ultra VIP Luxe)</option>
              </select>
            </div>
          </div>

          {/* Rows Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-400">Nombre de Rangées</label>
              <span className="text-xs font-mono font-bold text-orange-400">{rowsCount} rangées</span>
            </div>
            <input
              type="range"
              min={4}
              max={16}
              value={rowsCount}
              onChange={(e) => setRowsCount(parseInt(e.target.value, 10))}
              className="w-full accent-orange-500"
            />
          </div>

          {/* Amenities & Structural Elements Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Éléments & Aménagements à Bord
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center space-x-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasToilet}
                  onChange={(e) => setHasToilet(e.target.checked)}
                  className="accent-orange-500 rounded"
                />
                <span className="text-slate-300 font-bold">Toilettes Arrière</span>
              </label>

              <label className="flex items-center space-x-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasMiniBar}
                  onChange={(e) => setHasMiniBar(e.target.checked)}
                  className="accent-orange-500 rounded"
                />
                <span className="text-slate-300 font-bold">Mini-Bar / Boissons</span>
              </label>

              <label className="flex items-center space-x-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasMiddleDoor}
                  onChange={(e) => setHasMiddleDoor(e.target.checked)}
                  className="accent-orange-500 rounded"
                />
                <span className="text-slate-300 font-bold">Porte Centrale</span>
              </label>

              <label className="flex items-center space-x-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasStairs}
                  onChange={(e) => setHasStairs(e.target.checked)}
                  className="accent-orange-500 rounded"
                />
                <span className="text-slate-300 font-bold">Escalier 3D</span>
              </label>
            </div>
          </div>

          {/* Reserved Categorization */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Catégories & Règles de Sièges
            </span>

            <div className="flex items-center space-x-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30 flex items-center space-x-1">
                <Crown className="w-3 h-3" />
                <span>Rangées VIP : 1, 2</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30 flex items-center space-x-1">
                <Accessibility className="w-3 h-3" />
                <span>Sièges PMR : Rangée 1</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Live 3D Preview (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-black text-white uppercase tracking-wider">
                Aperçu 3D Interactif en Direct
              </span>
            </div>
            <span className="text-xs font-mono font-extrabold text-emerald-400">
              Capacité Totale : {currentLayout.totalSeats} Sièges
            </span>
          </div>

          {/* Render 3D component with current dynamically built layout */}
          <Seat3DRenderer
            layout={currentLayout}
            selectedSeats={[]}
            occupiedSeats={[2, 3, 7, 8]}
            blockedSeats={blockedSeats}
            onSeatClick={(seatNum) => {
              // Toggle blocked seat on click in builder mode
              setBlockedSeats(prev => 
                prev.includes(seatNum) ? prev.filter(s => s !== seatNum) : [...prev, seatNum]
              );
            }}
            readOnly={false}
          />
          <p className="text-[11px] text-slate-400 italic text-center">
            Cliquez sur un fauteuil dans l'aperçu 3D pour le bloquer / débloquer pour maintenance.
          </p>
        </div>
      </div>
    </div>
  );
};

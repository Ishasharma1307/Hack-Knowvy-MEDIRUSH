import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  Trash2, 
  Plus, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Edit2,
  AlertTriangle,
  Flame,
  Check,
  Code,
  ShieldAlert
} from 'lucide-react';
import { MedicineItem, UrgencyLevel, StructuredMedicineRequest } from '../types';

interface UnderstandingPageProps {
  medicines: MedicineItem[];
  urgency: UrgencyLevel;
  userNote?: string;
  extractionSource: 'gemini' | 'fallback' | 'demo';
  safetyAlert?: string;
  onConfirm: (structuredRequest: StructuredMedicineRequest) => void;
  onBack: () => void;
  isOptimizing?: boolean;
}

export const UnderstandingPage: React.FC<UnderstandingPageProps> = ({
  medicines: initialMedicines,
  urgency: initialUrgency,
  userNote = '',
  extractionSource,
  safetyAlert,
  onConfirm,
  onBack,
  isOptimizing = false,
}) => {
  const [items, setItems] = useState<MedicineItem[]>(initialMedicines);
  const [urgency, setUrgency] = useState<UrgencyLevel>(initialUrgency);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState(1);
  const [editUnit, setEditUnit] = useState('strip');

  // Add new item state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('strip');
  const [newQty, setNewQty] = useState(1);

  // Show developer contract preview toggle
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  // Edit medicine card handler
  const startEditing = (med: MedicineItem) => {
    setEditingId(med.id);
    setEditName(med.name);
    setEditQty(med.quantity);
    setEditUnit(med.unit || 'strip');
  };

  const saveEdit = (id: string) => {
    if (!editName.trim()) return;
    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            name: editName.trim(),
            quantity: Math.max(1, editQty),
            unit: editUnit.trim() || 'strip',
          };
        }
        return item;
      })
    );
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const updated = Math.max(1, item.quantity + delta);
          return { ...item, quantity: updated };
        }
        return item;
      })
    );
  };

  const handleRemove = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddItem = () => {
    if (!newName.trim()) return;
    const newItem: MedicineItem = {
      id: `added_${Date.now()}`,
      name: newName.trim(),
      quantity: Math.max(1, Number(newQty)),
      unit: newUnit.trim() || 'strip',
      urgency,
      notes: 'Added during confirmation',
    };
    setItems(prev => [...prev, newItem]);
    setNewName('');
    setNewUnit('strip');
    setNewQty(1);
    setIsAddingNew(false);
  };

  // Build clean Structured Output contract ready for the next stage
  const structuredContract: StructuredMedicineRequest = {
    medicines: items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || 'strip',
    })),
    urgency,
    user_note: userNote || 'Prescription confirmed by user',
  };

  const handleConfirmClick = () => {
    onConfirm(structuredContract);
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-8 animate-fadeIn">
      {/* Header section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-[#2E7D32] text-xs font-bold border border-emerald-200 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Clinical Confirmation</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-['Outfit'] text-slate-900 tracking-tight">
          Here's what MediRush understood
        </h1>
        <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
          Please review and edit the extracted medicine requirements. Your confirmation ensures 100% accuracy before routing to the fulfilment engine.
        </p>
      </div>

      {/* Safety Alert if emergency or clinical query */}
      {safetyAlert && (
        <div className="bg-rose-50 border border-rose-300/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-900 animate-fadeIn shadow-xs">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-rose-900 text-sm font-['Outfit']">Clinical Safety Notice</h4>
            <p className="leading-relaxed">{safetyAlert}</p>
          </div>
        </div>
      )}

      {/* Extraction Status & Urgency Badge */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-[#2E7D32]" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <span>{items.length} Medicines Identified</span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                urgency === 'emergency' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                urgency === 'urgent' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
                {urgency}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Extraction: {
                extractionSource === 'gemini' ? 'Gemini 2.5 Flash Structured JSON' :
                extractionSource === 'demo' ? 'Predefined Hackathon Demo Dataset' :
                'Clinical NLP Rules Engine (Offline Failsafe)'
              }
            </p>
          </div>
        </div>

        {/* Urgency Selector for Confirmation */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-[11px] text-slate-400 font-bold mr-1">Urgency:</span>
          {(['normal', 'urgent', 'emergency'] as UrgencyLevel[]).map(lvl => (
            <button
              key={lvl}
              type="button"
              onClick={() => setUrgency(lvl)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                urgency === lvl
                  ? lvl === 'emergency' ? 'bg-rose-600 text-white shadow-xs' :
                    lvl === 'urgent' ? 'bg-amber-500 text-white shadow-xs' :
                    'bg-[#1565C0] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Add New Item Form if toggled */}
      {isAddingNew ? (
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Add Additional Medicine</span>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <input
              type="text"
              placeholder="Medicine Name (e.g. Paracetamol)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="sm:col-span-6 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#1565C0] focus:outline-none"
            />
            <input
              type="number"
              min={1}
              value={newQty}
              onChange={(e) => setNewQty(parseInt(e.target.value) || 1)}
              className="sm:col-span-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-center focus:ring-2 focus:ring-[#1565C0] focus:outline-none"
            />
            <select
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              className="sm:col-span-3 px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#1565C0] focus:outline-none"
            >
              <option value="strip">strip</option>
              <option value="tablet">tablet</option>
              <option value="bottle">bottle</option>
              <option value="box">box</option>
              <option value="pack">pack</option>
              <option value="sachet">sachet</option>
              <option value="inhaler">inhaler</option>
            </select>
            <button
              type="button"
              onClick={handleAddItem}
              className="sm:col-span-1 bg-[#1565C0] text-white rounded-xl flex items-center justify-center hover:bg-[#0D47A1] transition py-2"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsAddingNew(true)}
            className="text-xs px-3.5 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-[#1565C0] font-bold border border-blue-200 shadow-2xs transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Medicine</span>
          </button>
        </div>
      )}

      {/* Structured Medicine Cards List */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3 shadow-xs">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <h4 className="text-base font-bold text-slate-800 font-['Outfit']">No medicines detected in request</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Please click "Add Medicine" to specify medicine items or return to rephrase your request.
            </p>
            <button
              type="button"
              onClick={() => setIsAddingNew(true)}
              className="px-5 py-2.5 bg-[#1565C0] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#0D47A1] transition"
            >
              Add Medicine Manually
            </button>
          </div>
        ) : (
          items.map((med, index) => {
            const isEditing = editingId === med.id;

            return (
              <div
                key={med.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
              >
                {isEditing ? (
                  /* Inline Edit Mode */
                  <div className="space-y-3 animate-fadeIn">
                    <div className="text-xs font-bold text-slate-700">Edit Medicine Details</div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="sm:col-span-6 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1565C0]"
                      />
                      <input
                        type="number"
                        min={1}
                        value={editQty}
                        onChange={(e) => setEditQty(parseInt(e.target.value) || 1)}
                        className="sm:col-span-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#1565C0]"
                      />
                      <select
                        value={editUnit}
                        onChange={(e) => setEditUnit(e.target.value)}
                        className="sm:col-span-2 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1565C0]"
                      >
                        <option value="strip">strip</option>
                        <option value="tablet">tablet</option>
                        <option value="bottle">bottle</option>
                        <option value="box">box</option>
                        <option value="pack">pack</option>
                        <option value="sachet">sachet</option>
                        <option value="inhaler">inhaler</option>
                      </select>
                      <div className="sm:col-span-2 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => saveEdit(med.id)}
                          className="flex-1 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl text-xs font-bold transition flex items-center justify-center"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard Card Display */
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1565C0] flex items-center justify-center font-black text-sm border border-blue-100 shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold font-['Outfit'] text-slate-900">
                            {med.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => startEditing(med)}
                            className="text-slate-400 hover:text-[#1565C0] p-1 rounded-lg hover:bg-slate-100 transition"
                            title="Edit name or unit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 font-medium">
                          <span className="text-slate-800 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                            Quantity: {med.quantity} {med.unit || 'strip'}
                          </span>
                          {med.dosage && (
                            <span className="text-slate-400">
                              • {med.dosage}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stepper & Delete */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(med.id, -1)}
                          disabled={med.quantity <= 1}
                          className="w-7 h-7 rounded-lg bg-white text-slate-700 flex items-center justify-center text-sm font-bold shadow-2xs hover:bg-slate-50 disabled:opacity-40 transition"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-black text-slate-800">
                          {med.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(med.id, 1)}
                          className="w-7 h-7 rounded-lg bg-white text-slate-700 flex items-center justify-center text-sm font-bold shadow-2xs hover:bg-slate-50 transition"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemove(med.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        title="Delete medicine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Safety Notice */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-[#2E7D32]">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#2E7D32]" />
        <p className="leading-relaxed">
          <strong>Mandatory Confirmation:</strong> MediRush never silently places orders without user review. Your confirmed list will be formatted into a standardized JSON payload ready for the Smart Fulfilment Engine.
        </p>
      </div>

      {/* Developer Contract Preview (Demonstrating Clean Architecture) */}
      <div className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/70 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-[#1565C0]" />
            Structured Data Contract Ready for Next Stage
          </span>
          <button
            type="button"
            onClick={() => setShowJsonPreview(!showJsonPreview)}
            className="text-[11px] text-[#1565C0] font-semibold hover:underline"
          >
            {showJsonPreview ? 'Hide JSON' : 'View JSON Contract'}
          </button>
        </div>

        {showJsonPreview && (
          <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto">
            {JSON.stringify(structuredContract, null, 2)}
          </pre>
        )}
      </div>

      {/* Navigation & CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs border border-slate-200 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Request</span>
        </button>

        <button
          type="button"
          disabled={items.length === 0 || isOptimizing}
          onClick={handleConfirmClick}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold text-base shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Find Fastest Fulfilment</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

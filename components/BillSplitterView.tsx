
import React, { useState, useEffect, useMemo } from 'react';
import { CalculatorIcon, InformationCircleIcon, PlusIcon, TrashIcon, UserGroupIcon, ExclamationIcon, CheckCircleIcon, DocumentDownloadIcon, MailIcon, WhatsAppIcon } from './Icons';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

interface Participant {
    id: number;
    name: string;
    consumption: number | '';
    result: number;
}

const BillSplitterView: React.FC = () => {
    const [method, setMethod] = useState<'simple' | 'advanced'>('advanced');
    const [totalBill, setTotalBill] = useState<number | ''>('');
    const [totalConsumption, setTotalConsumption] = useState<number | ''>('');
    
    // Nuovi stati per la suddivisione delle spese fisse
    const [fixedFee, setFixedFee] = useState<number | ''>('');
    const [powerFee, setPowerFee] = useState<number | ''>('');
    const [otherFee, setOtherFee] = useState<number | ''>('');
    
    // Default 2 participants
    const [participants, setParticipants] = useState<Participant[]>([
        { id: 1, name: '', consumption: '', result: 0 },
        { id: 2, name: '', consumption: '', result: 0 }
    ]);

    const [unitCost, setUnitCost] = useState<number>(0);
    const [variableRate, setVariableRate] = useState<number>(0);
    const [fixedPerPerson, setFixedPerPerson] = useState<number>(0);
    const [totalFixedCalculated, setTotalFixedCalculated] = useState<number>(0);

    // --- Actions ---

    const addParticipant = () => {
        const newId = participants.length > 0 ? Math.max(...participants.map(p => p.id)) + 1 : 1;
        setParticipants([...participants, { 
            id: newId, 
            name: '', 
            consumption: '', 
            result: 0 
        }]);
    };

    const removeParticipant = (id: number) => {
        if (participants.length <= 1) {
            alert("Devi avere almeno un partecipante.");
            return;
        }
        setParticipants(participants.filter(p => p.id !== id));
    };

    const updateParticipant = (id: number, field: 'name' | 'consumption', value: string | number) => {
        setParticipants(prev => prev.map(p => {
            if (p.id === id) {
                return { ...p, [field]: value };
            }
            return p;
        }));
    };

    const handleClear = () => {
        setTotalBill('');
        setTotalConsumption('');
        setFixedFee('');
        setPowerFee('');
        setOtherFee('');
        setParticipants([
            { id: 1, name: '', consumption: '', result: 0 },
            { id: 2, name: '', consumption: '', result: 0 }
        ]);
    };

    const handleExportPDF = (returnBlob: boolean = false) => {
        const doc = new jsPDF();
        const primaryColor = [41, 128, 185]; // Bel blu professionale
        const darkColor = [44, 62, 80]; // Grigio scuro/Blu notte

        // --- Intestazione ---
        doc.setFontSize(22);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.setFont("helvetica", "bold");
        doc.text("Prospetto Ripartizione Costi", 14, 20);
        
        // Data
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        const dateStr = new Date().toLocaleDateString('it-IT');
        doc.text(`Data: ${dateStr}`, 196, 20, { align: 'right' });

        // Linea separatrice spessa
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(1);
        doc.line(14, 25, 196, 25);

        // --- Dati Generali (Box Grigio) - VERTICALE ---
        
        // Calcolo altezza dinamica box in base al metodo e ai partecipanti (per la lista consumi)
        // Base height per header + metodo + importo + consumo totale row
        let contentHeight = 35; 
        
        // Spazio per la lista consumi inquilini
        contentHeight += (participants.length * 5); 

        // Spazio per spese fisse e dettagli (solo advanced)
        if (method === 'advanced') {
            contentHeight += 25; 
        } else {
            contentHeight += 5; // Padding bottom
        }

        const boxStartY = 30;
        
        doc.setFillColor(245, 247, 250);
        doc.rect(14, boxStartY, 182, contentHeight, 'F');

        doc.setFontSize(11);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.setFont("helvetica", "bold");
        doc.text("Dati Bolletta", 20, 38);

        doc.setFontSize(10);
        let currentY = 46;
        const lineHeight = 7;

        // 1. Metodo
        doc.setFont("helvetica", "normal");
        doc.text("Metodo di Calcolo:", 20, currentY);
        doc.setFont("helvetica", "bold");
        if (method === 'advanced') {
            doc.text("Quote Fisse + Consumo", 80, currentY);
        } else {
            doc.text("Semplice (Proporzionale)", 80, currentY);
        }
        currentY += lineHeight;

        // 2. Importo
        const billStr = totalBill ? Number(totalBill).toLocaleString('it-IT', {style:'currency', currency:'EUR'}) : '€ 0,00';
        doc.setFont("helvetica", "normal");
        doc.text("Importo Totale Fattura:", 20, currentY);
        doc.setFont("helvetica", "bold");
        doc.text(billStr, 80, currentY);
        currentY += lineHeight;

        // 3. Consumo Totale
        const consStr = totalConsumption ? totalConsumption.toString() + ' kW' : '0 kW';
        doc.setFont("helvetica", "normal");
        doc.text("Consumo Totale:", 20, currentY);
        doc.setFont("helvetica", "bold");
        doc.text(consStr, 80, currentY);
        currentY += 5; // Spazio prima dei dettagli consumi

        // 3a. Ripartizione Consumi (SOLO VALORI)
        doc.setFontSize(9);
        doc.setTextColor(120, 128, 140); // Grigio più chiaro
        
        participants.forEach(p => {
            const pCons = p.consumption ? `${p.consumption} kW` : '0 kW';
            // Solo il consumo, senza nome
            doc.text(`- ${pCons}`, 25, currentY);
            currentY += 5;
        });

        // Reset font e colore e aggiungi spazio
        doc.setFontSize(10);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        currentY += 2; // Extra spacer

        // 4. Spese Fisse (solo se advanced)
        if (method === 'advanced') {
            const fixedStr = totalFixedCalculated ? totalFixedCalculated.toLocaleString('it-IT', {style:'currency', currency:'EUR'}) : '€ 0,00';
            doc.setFont("helvetica", "normal");
            doc.text("Spese Fisse Totali:", 20, currentY);
            doc.setFont("helvetica", "bold");
            doc.text(fixedStr, 80, currentY);
            currentY += 6; // Spazio prima dei dettagli

            // Ripartizione spese fisse in piccolo
            doc.setFontSize(9);
            doc.setTextColor(120, 128, 140); // Grigio più chiaro

            const fStr = fixedFee ? Number(fixedFee).toLocaleString('it-IT', {style:'currency', currency:'EUR'}) : '€ 0,00';
            doc.text(`- Quota Fissa: ${fStr}`, 25, currentY);
            currentY += 5;

            const pStr = powerFee ? Number(powerFee).toLocaleString('it-IT', {style:'currency', currency:'EUR'}) : '€ 0,00';
            doc.text(`- Quota Potenza: ${pStr}`, 25, currentY);
            currentY += 5;

            const oStr = otherFee ? Number(otherFee).toLocaleString('it-IT', {style:'currency', currency:'EUR'}) : '€ 0,00';
            doc.text(`- Altre Partite: ${oStr}`, 25, currentY);
            
            // Reset font e colore per il resto
            doc.setFontSize(10);
            doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        }

        // --- Tabella ---
        const tableData = participants.map(p => [
            p.name || 'Inquilino',
            `${p.consumption || '0'} kW`, // Aggiunta unità kW
            p.result.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
        ]);

        // Calcolo totali per il footer
        const currentSumConsumptions = participants.reduce((sum, p) => sum + (Number(p.consumption) || 0), 0);
        const currentTotalCalculated = participants.reduce((sum, p) => sum + p.result, 0);

        // Posizione di partenza tabella dinamica (subito dopo il box grigio + margine)
        const tableStartY = boxStartY + contentHeight + 10;

        (autoTable as any)(doc, {
            startY: tableStartY,
            head: [['Nominativo', 'Consumo Rilevato', 'Importo Dovuto']],
            body: tableData,
            foot: [[
                'TOTALI', 
                `${currentSumConsumptions} kW`, 
                currentTotalCalculated.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
            ]],
            theme: 'striped',
            headStyles: { 
                fillColor: darkColor, 
                textColor: 255, 
                fontStyle: 'bold',
                halign: 'left'
            },
            footStyles: {
                fillColor: [240, 240, 240], // Light gray footer
                textColor: darkColor,
                fontStyle: 'bold',
                fontSize: 11
            },
            styles: { 
                fontSize: 11, 
                cellPadding: 4,
                valign: 'middle'
            },
            // Column styles apply to HEAD, BODY, and FOOT rows
            // SET ALL COLUMNS TO LEFT ALIGNMENT
            columnStyles: {
                0: { halign: 'left' },   // Name aligned left
                1: { halign: 'left' },   // Consumption aligned left
                2: { halign: 'left' }    // Amount aligned left
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            }
        });

        // --- Footer Professionale (Bottom of Page) ---
        const pageHeight = doc.internal.pageSize.height;
        const footerY = pageHeight - 30;

        // Linea separatrice sottile
        doc.setDrawColor(200);
        doc.setLineWidth(0.2);
        doc.line(14, footerY, 196, footerY);

        // Blocco Firma
        doc.setFontSize(10);
        doc.setTextColor(60); 
        doc.setFont("helvetica", "bold");
        doc.text("Powered by: Michele Carchia", 105, footerY + 8, { align: "center" });

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(120);
        doc.text("Consulenza & Gestione Utenze", 105, footerY + 13, { align: "center" });
        doc.text("Cell: 329 244 5561  •  Email: carchia1980@gmail.com", 105, footerY + 18, { align: "center" });

        if (!returnBlob) {
            doc.save(`ripartizione_bolletta_${dateStr.replace(/\//g, '-')}.pdf`);
        }
        return doc;
    };

    const handleShare = (platform: 'whatsapp' | 'email') => {
        if (!totalBill || participants.length === 0) return;

        // 1. Scarica il PDF per l'utente (così ce l'ha da allegare)
        handleExportPDF();

        // 2. Prepara il messaggio
        const text = `Ciao,\necco il prospetto di ripartizione della bolletta (Totale: ${Number(totalBill).toLocaleString('it-IT', {style:'currency', currency:'EUR'})}).\nHo scaricato il PDF con tutti i dettagli, te lo allego qui sotto.`;
        
        // 3. Apri l'app
        if (platform === 'whatsapp') {
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        } else {
            window.open(`mailto:?subject=Ripartizione Bolletta&body=${encodeURIComponent(text)}`, '_self');
        }

        // 4. Avviso UI
        alert("Il PDF è stato scaricato sul tuo dispositivo.\n\nOra si aprirà l'app scelta: ricordati di ALLEGARE manualmente il file PDF appena scaricato al messaggio!");
    };

    // --- Calculations ---

    // Sum of inputs
    const sumConsumptions = useMemo(() => {
        return participants.reduce((sum, p) => sum + (Number(p.consumption) || 0), 0);
    }, [participants]);

    const consumptionDiff = (Number(totalConsumption) || 0) - sumConsumptions;
    // Tolerance for float math
    const isConsumptionMatch = Math.abs(consumptionDiff) < 0.1;
    const isConsumptionOver = consumptionDiff < -0.1;
    
    const totalCalculated = useMemo(() => {
        return participants.reduce((sum, p) => sum + p.result, 0);
    }, [participants]);

    useEffect(() => {
        const bill = Number(totalBill) || 0;
        const totCons = Number(totalConsumption) || 1; // Prevent div/0
        
        // Calcolo somma spese fisse
        const fFee = Number(fixedFee) || 0;
        const pFee = Number(powerFee) || 0;
        const oFee = Number(otherFee) || 0;
        const totalFixed = fFee + pFee + oFee;
        
        setTotalFixedCalculated(totalFixed);

        const count = participants.length || 1;

        let fPerPerson = 0;
        let vRate = 0;
        let uCost = 0;

        if (method === 'simple') {
            // Metodo 1: Proporzionale Puro
            // Costo Unitario = Totale Bolletta / Totale Consumo
            uCost = bill / totCons;
            
            setUnitCost(uCost);
            setFixedPerPerson(0);
            setVariableRate(0);

            setParticipants(prev => prev.map(p => ({
                ...p,
                result: (Number(p.consumption) || 0) * uCost
            })));

        } else {
            // Metodo 2: Quote Fisse + Variabili
            // 1. Dividi i costi fissi totali in parti uguali
            fPerPerson = totalFixed / count;
            
            // 2. Calcola il costo dell'energia pura (variabile)
            const variableTotal = bill - totalFixed;
            
            // 3. Calcola il tasso variabile al kWh/Smc
            vRate = variableTotal / totCons;

            setFixedPerPerson(fPerPerson);
            setVariableRate(vRate);
            setUnitCost(0);

            setParticipants(prev => prev.map(p => ({
                ...p,
                result: fPerPerson + ((Number(p.consumption) || 0) * vRate)
            })));
        }
    }, [totalBill, totalConsumption, fixedFee, powerFee, otherFee, method, participants.length, JSON.stringify(participants.map(p => p.consumption))]);


    return (
        <div className="animate-fade-in p-2 md:p-6 max-w-6xl mx-auto flex flex-col">
            <div className="flex items-center mb-6 space-x-3">
                <div className="bg-emerald-500 p-2 rounded-lg">
                    <CalculatorIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Calcolatrice Bollette</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Ripartizione costi avanzata per N partecipanti</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-2">
                
                {/* --- LEFT COLUMN: Settings & Global Inputs --- */}
                <div className="xl:col-span-1 space-y-6">
                    
                    {/* Method Selector */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                        <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Metodo di Calcolo</h3>
                        <div className="flex flex-col space-y-3">
                            <label className={`cursor-pointer border rounded-lg p-3 transition-all flex items-center ${method === 'advanced' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500' : 'border-slate-200 dark:border-slate-700'}`}>
                                <input type="radio" name="method" value="advanced" checked={method === 'advanced'} onChange={() => setMethod('advanced')} className="sr-only" />
                                <div className="flex-1">
                                    <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">Quote Fisse + Variabili (Consigliato)</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Costi fissi divisi in parti uguali, consumo in base alla lettura.</div>
                                </div>
                                {method === 'advanced' && <CheckCircleIcon className="h-5 w-5 text-emerald-500" />}
                            </label>

                            <label className={`cursor-pointer border rounded-lg p-3 transition-all flex items-center ${method === 'simple' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500' : 'border-slate-200 dark:border-slate-700'}`}>
                                <input type="radio" name="method" value="simple" checked={method === 'simple'} onChange={() => setMethod('simple')} className="sr-only" />
                                <div className="flex-1">
                                    <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">Semplice (Proporzionale)</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tutto diviso in base al consumo. Penalizza chi consuma di più.</div>
                                </div>
                                {method === 'simple' && <CheckCircleIcon className="h-5 w-5 text-emerald-500" />}
                            </label>
                        </div>
                    </div>

                    {/* Global Data Inputs */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 space-y-4">
                        <h3 className="font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">Dati Bolletta</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Totale da Pagare (€)</label>
                            <input 
                                type="number" 
                                value={totalBill} 
                                onChange={e => setTotalBill(e.target.value === '' ? '' : Number(e.target.value))} 
                                className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-emerald-500 focus:border-emerald-500" 
                                placeholder="Es. 150.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Consumo Totale Fatturato</label>
                            <input 
                                type="number" 
                                value={totalConsumption} 
                                onChange={e => setTotalConsumption(e.target.value === '' ? '' : Number(e.target.value))} 
                                className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-emerald-500 focus:border-emerald-500" 
                                placeholder="Es. 500 kWh"
                            />
                        </div>

                        {method === 'advanced' && (
                            <div className="bg-slate-50 dark:bg-slate-700/30 p-3 rounded-lg border border-slate-200 dark:border-slate-600 animate-fade-in-down">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 border-b dark:border-slate-600 pb-1">
                                    Dettaglio Spese Fisse
                                </label>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Quota Fissa</label>
                                        <input 
                                            type="number" 
                                            value={fixedFee} 
                                            onChange={e => setFixedFee(e.target.value === '' ? '' : Number(e.target.value))} 
                                            className="w-full p-1.5 border rounded text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-emerald-500" 
                                            placeholder="Es. 10.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Quota Potenza</label>
                                        <input 
                                            type="number" 
                                            value={powerFee} 
                                            onChange={e => setPowerFee(e.target.value === '' ? '' : Number(e.target.value))} 
                                            className="w-full p-1.5 border rounded text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-emerald-500" 
                                            placeholder="Es. 5.50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Altre Partite (Opzionale)</label>
                                        <input 
                                            type="number" 
                                            value={otherFee} 
                                            onChange={e => setOtherFee(e.target.value === '' ? '' : Number(e.target.value))} 
                                            className="w-full p-1.5 border rounded text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-emerald-500" 
                                            placeholder="Es. 2.00 (o lasciare vuoto)"
                                        />
                                    </div>
                                </div>
                                <div className="text-xs text-slate-500 mt-2 pt-2 border-t dark:border-slate-600 flex justify-between">
                                    <span>Totale Fisse:</span>
                                    <span className="font-bold">{totalFixedCalculated.toLocaleString('it-IT', {style:'currency', currency:'EUR'})}</span>
                                </div>
                            </div>
                        )}
                        
                        <div className="pt-2 text-center">
                            <button onClick={handleClear} className="text-sm text-slate-500 hover:text-red-500 underline transition-colors">Resetta Tutto</button>
                        </div>
                    </div>
                </div>

                {/* --- MIDDLE COLUMN: Participants List --- */}
                <div className="xl:col-span-2 flex flex-col h-full space-y-6">
                    
                    {/* Participants Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md flex flex-col flex-1 overflow-hidden min-h-[400px]">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                            <h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center">
                                <UserGroupIcon className="h-5 w-5 mr-2" />
                                Ripartizione Consumi
                            </h3>
                            <button 
                                onClick={addParticipant}
                                className="flex items-center text-sm font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 bg-sky-50 dark:bg-sky-900/30 px-3 py-1.5 rounded-full transition-colors"
                            >
                                <PlusIcon className="h-4 w-4 mr-1" />
                                Aggiungi
                            </button>
                        </div>

                        {/* Validation Bar */}
                        {totalConsumption !== '' && (
                            <div className={`px-6 py-2 text-xs font-semibold flex justify-between items-center transition-colors ${
                                isConsumptionMatch 
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' 
                                    : isConsumptionOver 
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                            }`}>
                                <div className="flex items-center">
                                    {!isConsumptionMatch && <ExclamationIcon className="h-4 w-4 mr-2" />}
                                    {isConsumptionMatch && <CheckCircleIcon className="h-4 w-4 mr-2" />}
                                    
                                    {isConsumptionMatch 
                                        ? "I consumi inseriti corrispondono al totale." 
                                        : isConsumptionOver 
                                            ? `Attenzione: Hai inserito ${Math.abs(consumptionDiff).toFixed(2)} unità in più del totale!`
                                            : `Mancano ancora ${consumptionDiff.toFixed(2)} unità da assegnare.`
                                    }
                                </div>
                                <div>
                                    {sumConsumptions} / {totalConsumption}
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-0">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-3 w-1/3">Nome</th>
                                        <th className="px-6 py-3 w-1/3">Consumo</th>
                                        <th className="px-6 py-3 text-right">Da Pagare</th>
                                        <th className="px-6 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {participants.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-3">
                                                <input 
                                                    type="text" 
                                                    value={p.name} 
                                                    onChange={e => updateParticipant(p.id, 'name', e.target.value)} 
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-slate-800 dark:text-slate-200 focus:ring-emerald-500 focus:border-emerald-500"
                                                    placeholder="Nome inquilino..."
                                                />
                                            </td>
                                            <td className="px-6 py-3">
                                                <input 
                                                    type="number" 
                                                    value={p.consumption} 
                                                    onChange={e => updateParticipant(p.id, 'consumption', e.target.value === '' ? '' : Number(e.target.value))} 
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-slate-800 dark:text-slate-200 focus:ring-emerald-500 focus:border-emerald-500"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="px-6 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                                                {p.result.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <button 
                                                    onClick={() => removeParticipant(p.id)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30"
                                                    title="Rimuovi"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- BOTTOM SUMMARY PANEL --- */}
            <div className="mt-6">
                <div className="bg-slate-600 text-slate-200 p-6 rounded-xl shadow-lg border border-slate-500">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        {/* Left: Technical Stats */}
                        <div className="flex-1 space-y-2 text-center md:text-left w-full md:w-auto">
                            <h4 className="text-white font-bold uppercase text-xs tracking-wider opacity-70 border-b border-slate-500 pb-1 mb-2">Dettagli Calcolo</h4>
                            {method === 'advanced' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs opacity-60">Quota Fissa (a testa)</div>
                                        <div className="text-lg font-mono text-emerald-400">{fixedPerPerson.toLocaleString('it-IT', {style:'currency', currency:'EUR'})}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs opacity-60">Costo Variabile</div>
                                        <div className="text-lg font-mono text-sky-400">{variableRate.toFixed(4)} €/unità</div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="text-xs opacity-60">Costo Medio Unitario</div>
                                    <div className="text-lg font-mono text-emerald-400">{unitCost.toFixed(4)} €/unità</div>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="hidden md:block w-px h-16 bg-slate-500"></div>

                        {/* Middle: Consumption Check */}
                        <div className="text-center w-full md:w-auto">
                             <h4 className="text-white font-bold uppercase text-xs tracking-wider opacity-70 mb-1">Quadratura Consumi</h4>
                             <div className={`text-2xl font-bold font-mono ${isConsumptionMatch ? 'text-green-400' : 'text-amber-400'}`}>
                                {sumConsumptions} <span className="text-sm text-slate-400 font-sans font-normal">/ {totalConsumption || 0}</span>
                             </div>
                             <div className="text-xs opacity-50 mt-1">Inseriti / Totale Bolletta</div>
                        </div>

                        {/* Divider */}
                        <div className="hidden md:block w-px h-16 bg-slate-500"></div>

                        {/* Right: Grand Total & PDF Buttons */}
                        <div className="flex flex-col items-center md:items-end w-full md:w-auto gap-4">
                            <div className="text-center md:text-right">
                                <h4 className="text-white font-bold uppercase text-xs tracking-wider opacity-70 mb-1">Totale Ripartito</h4>
                                <div className="text-4xl font-bold text-white tracking-tight">
                                    {totalCalculated.toLocaleString('it-IT', {style:'currency', currency:'EUR'})}
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleShare('whatsapp')}
                                    disabled={!totalBill || participants.length === 0}
                                    className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-xs transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Invia PDF via WhatsApp"
                                >
                                    <WhatsAppIcon className="h-4 w-4 mr-1" />
                                    WhatsApp
                                </button>
                                <button
                                    onClick={() => handleShare('email')}
                                    disabled={!totalBill || participants.length === 0}
                                    className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Invia PDF via Email"
                                >
                                    <MailIcon className="h-4 w-4 mr-1" />
                                    Email
                                </button>
                                <button
                                    onClick={() => handleExportPDF(false)}
                                    disabled={!totalBill || participants.length === 0}
                                    className="flex items-center px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-xs transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <DocumentDownloadIcon className="h-4 w-4 mr-1" />
                                    Scarica
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillSplitterView;

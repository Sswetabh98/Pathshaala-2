import React, { useState, useRef, useEffect, useMemo } from 'react';
import { XIcon } from './icons/IconComponents';

interface SearchableMultiSelectProps {
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    label: string;
}

const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({ options, selected, onChange, placeholder, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = useMemo(() => {
        return options.filter(option => 
            option.toLowerCase().includes(searchTerm.toLowerCase()) && !selected.includes(option)
        );
    }, [options, searchTerm, selected]);

    const handleSelect = (option: string) => {
        onChange([...selected, option]);
        setSearchTerm('');
    };

    const handleDeselect = (option: string) => {
        onChange(selected.filter(item => item !== option));
    };

    return (
        <div ref={containerRef} className="relative">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <div className="input-style mt-1 w-full p-0 flex flex-wrap items-center gap-1 min-h-[46px]" onClick={() => setIsOpen(true)}>
                {selected.map(item => (
                    <div key={item} className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm font-medium px-2 py-1 m-1 rounded-md flex items-center gap-1">
                        <span>{item}</span>
                        <button type="button" onClick={() => handleDeselect(item)} className="text-indigo-500 hover:text-indigo-800 dark:hover:text-indigo-200"><XIcon className="w-3 h-3" /></button>
                    </div>
                ))}
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    placeholder={selected.length === 0 ? placeholder : ''}
                    className="flex-grow bg-transparent p-2 focus:outline-none"
                />
            </div>
            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(option => (
                            <button
                                type="button"
                                key={option}
                                onClick={() => handleSelect(option)}
                                className="w-full text-left p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                            >
                                {option}
                            </button>
                        ))
                    ) : (
                        <p className="p-2 text-sm text-slate-500">No results found.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableMultiSelect;
import React from "react";
import Select, { MultiValue } from "react-select";
import type { Address } from "../../utils/convertRecipients";

interface Props {
  label: string;
  placeholder: string;
  suggestions: Address[];
  value: string[];
  onChange: (v: string[]) => void;
}
const customStyles = {
  control: (provided: any) => ({
    ...provided,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: "0.75rem",
    padding: "2px 4px",
    border: "none",
    boxShadow: "0 0 0 1px rgba(0,0,0,0.2)",
  }),
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: "0.75rem",
    marginTop: 4,
    zIndex: 20,
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isFocused ? "rgba(0, 123, 255, 0.2)" : "transparent",
    color: "#000",
    padding: "10px 12px",
  }),
  multiValue: (provided: any) => ({
    ...provided,
    backgroundColor: "rgba(0, 123, 255, 0.1)",
  }),
  multiValueLabel: (provided: any) => ({
    ...provided,
    color: "#003366",
  }),
  multiValueRemove: (provided: any) => ({
    ...provided,
    color: "#003366",
    ':hover': {
      backgroundColor: 'rgba(0, 123, 255, 0.2)',
      color: '#000',
    },
  }),
};

export const MultiEmailSelect: React.FC<Props> = ({
  label,
  placeholder,
  suggestions,
  value,
  onChange,
}) => {
  const options = suggestions.map((p) => ({
    label: `${p.name} <${p.email}>`,
    value: p.email,
  }));

  return (
    <div className="mb-6">
      <label className="block mb-1 text-sm font-semibold">{label}</label>

      <Select
  classNamePrefix="react-select"
  options={options}
  placeholder={placeholder}
  isMulti
  closeMenuOnSelect={false}
  value={options.filter((o) => value.includes(o.value))}
  onChange={(sel: MultiValue<{ label: string; value: string }>) =>
    onChange(sel.map((o) => o.value))
  }
  styles={customStyles}
  menuPlacement="auto"
/>

    </div>
  );
};

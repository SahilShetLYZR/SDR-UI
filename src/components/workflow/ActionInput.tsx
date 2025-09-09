import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input"; // Import Input
import { Label } from "@/components/ui/label";
import {useHomeStore} from "@/store/home.store.ts";

export default function ActionInput({
  name,
  placeholder,
  value,
  onChange,
  disabled,
  isTextArea = false, // Add a prop to decide input type
  id, // Add id prop
}: {
  name: string;
  placeholder?: string;
  value: string | number; // Allow number values too
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void; // Adjust event type
  disabled?: boolean;
  isTextArea?: boolean; // Make it optional
  id?: string; // Make id optional, generate if needed
}) {
  const inputId =
    id || `action-input-${name.toLowerCase().replace(/\s+/g, "-")}`; // Generate id if not provided
  const campaignSettings = useHomeStore((state) => state.campaignSettings)

  const variables: string[] = ["knowledge_base", "research_data"];

  const general = campaignSettings?.general;
  const materials = campaignSettings?.materials;

  const isNotEmpty = (value: any): boolean => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "string") return value.trim() !== "";
    if (typeof value === "boolean") return value === true;
    return value !== null && value !== undefined;
  };

  if (general) {
    Object.values(general).forEach((field) => {
      if (isNotEmpty(field.field_value) && field.field_name) {
        variables.push(field.field_name);
      }
    });
  }

  if (materials) {
    Object.values(materials).forEach((field) => {
      if (isNotEmpty(field.field_value) && field.field_name) {
        variables.push(field.field_name);
      }
    });
  }

  return (
    <div className="grid w-full gap-1.5">
      <Label htmlFor={inputId}>{name}</Label>
      {isTextArea ? (
        <Textarea
          placeholder={placeholder}
          id={inputId}
          textValue={value}
          onChange={onChange}
          disabled={disabled}
          variables={variables}
          className="min-h-[100px]" // Give textarea a minimum height
        />
      ) : (
        <Input
          type="text" // Or allow other types like 'number', 'email'
          placeholder={placeholder}
          id={inputId}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      )}
    </div>
  );
}

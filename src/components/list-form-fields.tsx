import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/i18n";
import type { ListType } from "@/lib/types";

/** Name/description/public-switch trio shared by the new-list and edit-list
 * dialogs. `type`/`onTypeChange` are optional — edit doesn't let you change
 * a list's type once created, so that field only renders when both are
 * given (the new-list dialog). `idPrefix` keeps each dialog's field ids
 * unique in the DOM. */
export function ListFormFields({
  idPrefix,
  name,
  onNameChange,
  namePlaceholder,
  description,
  onDescriptionChange,
  descriptionPlaceholder,
  isPublic,
  onPublicChange,
  type,
  onTypeChange,
}: {
  idPrefix: string;
  name: string;
  onNameChange: (value: string) => void;
  namePlaceholder?: string;
  description: string;
  onDescriptionChange: (value: string) => void;
  descriptionPlaceholder?: string;
  isPublic: boolean;
  onPublicChange: (value: boolean) => void;
  type?: ListType;
  onTypeChange?: (value: ListType) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`${idPrefix}-name`}>{t.lists.nameLabel}</Label>
        <Input
          id={`${idPrefix}-name`}
          placeholder={namePlaceholder}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-description`}>{t.lists.descriptionLabel}</Label>
        <Textarea
          id={`${idPrefix}-description`}
          placeholder={descriptionPlaceholder}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
      </div>
      {type !== undefined && onTypeChange && (
        <div>
          <Label htmlFor={`${idPrefix}-type`}>{t.lists.typeLabel}</Label>
          <Select value={type} onValueChange={(v) => onTypeChange(v as ListType)}>
            <SelectTrigger id={`${idPrefix}-type`}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">{t.lists.typeCustom}</SelectItem>
              <SelectItem value="wishlist">{t.lists.typeWishlist}</SelectItem>
              <SelectItem value="reading">{t.lists.typeReading}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex items-center justify-between">
        <Label htmlFor={`${idPrefix}-public`}>{t.lists.publicLabel}</Label>
        <Switch id={`${idPrefix}-public`} checked={isPublic} onCheckedChange={onPublicChange} />
      </div>
    </div>
  );
}

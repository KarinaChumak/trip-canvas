import type { Meta, StoryObj } from '@storybook/react-vite';
import { PLACE_KINDS } from '@trip-canvas/catalog';
import { PlaceKindBadge } from '@/components/catalog/PlaceKindBadge';

const meta = {
  title: 'Catalog/PlaceKindBadge',
  component: PlaceKindBadge,
  argTypes: { kind: { control: 'select', options: PLACE_KINDS } },
} satisfies Meta<typeof PlaceKindBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The label is the place's category; the kind picks icon and tint. */
export const Default: Story = {
  args: { kind: 'temple', label: 'Buddhist temple' },
};

export const AllKinds: Story = {
  args: { kind: 'other', label: 'Other' },
  render: () => (
    <div className="flex flex-wrap gap-2">
      {PLACE_KINDS.map((kind) => (
        <PlaceKindBadge key={kind} kind={kind} label={kind} />
      ))}
    </div>
  ),
};

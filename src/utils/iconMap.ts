import { Ionicons } from '@expo/vector-icons';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// Every value here must exist in Ionicons — an unknown `name` renders as a
// blank glyph (and trips the Ionicons union type). Aliases map app concepts
// to the closest real glyph.
export function getIconName(icon: string): IoniconName {
  const iconMap: Record<string, IoniconName> = {
    water: 'water',
    fitness: 'fitness',
    book: 'book',
    meditation: 'flower',
    sunny: 'sunny',
    moon: 'moon',
    leaf: 'leaf',
    heart: 'heart',
    'musical-notes': 'musical-notes',
    camera: 'camera',
    bicycle: 'bicycle',
    walk: 'walk',
    sleep: 'bed',
    nutrition: 'nutrition',
    code: 'code',
    brush: 'brush',
    pill: 'medkit',
    flash: 'flash',
    diamond: 'diamond',
    star: 'star',
    flower: 'flower',
    tree: 'leaf',
    cloud: 'cloud',
    flame: 'flame',
    body: 'body',
    checkbox: 'checkbox',
    calendar: 'calendar',
    time: 'time',
    person: 'person',
    happy: 'happy',
  };
  return iconMap[icon] || 'ellipse';
}

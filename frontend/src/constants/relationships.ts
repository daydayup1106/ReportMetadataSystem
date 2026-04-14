/**
 * Shared relationship type mappings.
 * Integer keys match backend RelationType enum values.
 * String values are i18n translation keys under "members.*".
 */
export const RELATIONSHIP_KEYS: Record<number, string> = {
  0: 'self',
  1: 'mother',
  2: 'father',
  3: 'spouse',
  4: 'son',
  5: 'daughter',
  6: 'brother',
  7: 'sister',
  8: 'grandfather',
  9: 'grandmother',
  10: 'other',
  11: 'younger_brother',
  12: 'younger_sister',
  13: 'maternal_grandfather',
  14: 'maternal_grandmother',
}

/** Relationship options for member creation (excludes self=0). */
export const RELATIONSHIP_OPTION_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

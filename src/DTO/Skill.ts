// src/app/DTO/skill.dto.ts

// Le categorie arrivano dal DB come stringhe
// Se vuoi puoi in futuro restringerle, ma ora lasciamole dinamiche.
export type Category = string;

export interface Skill {
  id: number;
  name: string;
  level: 1 | 2 | 3 | 4 | 5;
  acquired: string;      // LocalDate dal BE serializzato come string
  years: number;         // già calcolato nel BE
  categories: Category[]; // nomi delle categorie
  keywords?: string[];
  notes?: string;
}

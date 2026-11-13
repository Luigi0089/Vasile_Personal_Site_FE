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

/**
 * Payload per creare / aggiornare una skill (SkillDto del BE).
 * id e years li gestisce il BE; categorie e keyword sono per nome.
 */
export interface SkillRequest {
  name: string;
  level: number;          // 1..5
  acquired: string | null; // yyyy-MM-dd
  notes?: string | null;
  categories: string[];
  keywords: string[];
}

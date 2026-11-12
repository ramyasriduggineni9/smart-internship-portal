# Datasets & Knowledge Graph Corpus

This directory houses the foundational datasets used by the **Smart Internship Portal** recommendation and skill-matching engine.

## 1. Naukri Job Postings Dataset (`archive.zip`)
- **File inside archive**: `naukri_com-job_sample.csv` (approx. 52 MB uncompressed)
- **Source**: Indian Tech Job Market & Internship dataset (Naukri.com sample).
- **Purpose**:
  - Provides real-world internship and entry-level job postings with industry-standard role titles, required skill tags, experience levels, and location attributes.
  - Used by the candidate matching module to validate realistic keyword co-occurrences and demand trends.

## 2. Tabiya ESCO Skills Taxonomy (`tabiya-open-dataset-main.zip`)
- **Source**: Tabiya Open Dataset (adapted from European Skills, Competences, Qualifications and Occupations - ESCO v1.1.1).
- **Structure**:
  - `skills.csv` & `occupations.csv`: Standardized identifiers and preferred labels for over 13,000 professional skills and jobs.
  - `occupation_skill_relations.csv`: Cross-linkages indicating whether a skill is essential or optional for a given role.
  - `skill_skill_relations.csv`: Ontological hierarchy and semantic relationships between complementary skills.
  - `ISCOGroups.csv` & `skillGroups.csv`: Taxonomic groupings used to structure the knowledge graph.
- **Purpose**:
  - Forms the backbone of the **Semantic Skill-Graph Matching Engine**.
  - Enables the portal to identify related competencies (e.g., matching a candidate skilled in *Python* with a role requiring *Django* or *Flask* via semantic transitive paths) instead of failing on rigid keyword matches.

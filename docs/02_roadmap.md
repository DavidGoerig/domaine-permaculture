# Roadmap technique — Site HTML/SVG interactif pour le domaine

Objectif : construire un premier outil visuel pour dessiner les zones du domaine, cliquer dessus, afficher les données agricoles, montrer les flux, les stockages, les animaux, les rotations et les tâches semaine par semaine.

Première version recommandée : HTML + CSS + JavaScript + SVG + JSON.

---

## 1. Pourquoi SVG pour commencer

SVG est le meilleur choix initial parce que :
- chaque zone peut être un rectangle, polygone ou chemin cliquable
- les dimensions sont faciles à ajuster
- on peut afficher des flèches pour les flux
- on peut colorer les zones selon la semaine, la culture ou la rotation
- on peut ajouter des labels
- le code reste simple
- on peut remplacer plus tard le rendu par Phaser, PixiJS ou Three.js

---

## 2. Structure du projet

```text
farm-visual-planner/
├── index.html
├── styles.css
├── app.js
├── data/
│   ├── zones.json
│   ├── plants.json
│   ├── animals.json
│   ├── flows.json
│   ├── calendar56.json
│   ├── storage.json
│   ├── transformations.json
│   └── recipes.json
└── assets/
    ├── icons/
    └── textures/
```

---

## 3. MVP 1 — plan SVG statique cliquable

Objectif :
- afficher un plan simple avec les zones
- cliquer sur une zone
- afficher un panneau latéral

À dessiner en SVG :
- maison Earthship
- serre semis
- serre séchoir
- cave/frigo naturel
- aquaponie
- bacs aromatiques
- bacs salades hiver
- zone 2 : 4 parcelles + poulailler central
- zone 3 : pâturage vaches + noyers + champignons + mellifères
- haies entre zones
- zones de stockage

Exemple minimal HTML :

```html
<svg id="farm-map" viewBox="0 0 1200 800">
  <rect id="zone1_earthship" x="50" y="50" width="180" height="100" class="zone zone-habitat"></rect>
  <rect id="zone1_aquaponie" x="260" y="50" width="160" height="100" class="zone zone-water"></rect>
  <rect id="zone2_parcelle_a" x="100" y="250" width="180" height="180" class="zone zone-crop"></rect>
  <rect id="zone2_poulailler" x="300" y="330" width="80" height="80" class="zone zone-animal"></rect>
</svg>

<aside id="side-panel">
  <h2 id="panel-title">Sélectionner une zone</h2>
  <div id="panel-content"></div>
</aside>
```

---

## 4. MVP 2 — charger les zones depuis JSON

Au lieu de coder les rectangles directement dans le HTML, on génère le SVG depuis `zones.json`.

Exemple `zones.json` :

```json
[
  {
    "id": "zone1_earthship",
    "name": "Maison Earthship",
    "type": "habitat",
    "surfaceM2": 180,
    "x": 50,
    "y": 50,
    "width": 180,
    "height": 100,
    "description": "Maison passive/autonome avec serre intégrée, puits canadien, récupération d’eau."
  }
]
```

Exemple JS :

```js
async function loadZones() {
  const response = await fetch("./data/zones.json");
  const zones = await response.json();

  const svg = document.getElementById("farm-map");

  zones.forEach(zone => {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");

    rect.setAttribute("id", zone.id);
    rect.setAttribute("x", zone.x);
    rect.setAttribute("y", zone.y);
    rect.setAttribute("width", zone.width);
    rect.setAttribute("height", zone.height);
    rect.classList.add("zone", `zone-${zone.type}`);

    rect.addEventListener("click", () => showZoneDetails(zone));

    svg.appendChild(rect);
  });
}
```

---

## 5. Panneau latéral

Le panneau doit afficher :
- nom de zone
- type
- surface
- description
- plantes
- animaux
- inputs
- outputs
- stockages
- transformations
- tâches de la semaine sélectionnée
- flux entrants/sortants

Structure visuelle :

```text
[Nom de la zone]
Type : maraîchage
Surface : 250 m²

Plantes :
- carotte Jaune du Doubs
- betterave Chioggia
- panais

Inputs :
- compost poules
- eau pluie

Outputs :
- légumes hiver
- déchets verts

Tâches semaine 18 :
- semer haricots
- pailler
- ouvrir aux poules après récolte précédente
```

---

## 6. MVP 3 — slider de semaines

Ajouter un slider :

```html
<input id="week-slider" type="range" min="1" max="56" value="1">
<span id="week-label">Semaine 1</span>
```

Comportement :
- quand on change de semaine, le site filtre les tâches
- les zones concernées changent de couleur
- les flux actifs s’affichent

Exemple JS :

```js
let selectedWeek = 1;

document.getElementById("week-slider").addEventListener("input", event => {
  selectedWeek = Number(event.target.value);
  document.getElementById("week-label").textContent = `Semaine ${selectedWeek}`;
  updateWeekView(selectedWeek);
});
```

---

## 7. MVP 4 — afficher les flux

Les flux sont des flèches entre zones.

Exemple `flows.json` :

```json
[
  {
    "id": "poules_vers_compost",
    "from": "zone2_poulailler",
    "to": "zone2_compost",
    "type": "fertility",
    "label": "fumier / litière",
    "activeWeeks": [1,2,3,4,5,6,7,8,9,10,11,12]
  }
]
```

Pour afficher une flèche SVG :
- récupérer le centre de la zone source
- récupérer le centre de la zone cible
- dessiner une ligne avec marker arrow

Exemple :

```html
<defs>
  <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto">
    <path d="M0,0 L0,6 L9,3 z"></path>
  </marker>
</defs>
```

Types de flux :
- eau
- fertilité
- nourriture animale
- récolte
- transformation
- stockage
- cuisine

---

## 8. MVP 5 — données agricoles liées aux zones

Chaque zone contient une liste de plantes ou d’animaux.

Exemple zone :

```json
{
  "id": "zone2_parcelle_a",
  "name": "Parcelle A — Racines & légumineuses",
  "plants": [
    "carotte_jaune_doubs",
    "betterave_chioggia",
    "panais_guernesey",
    "feve",
    "haricot_sec"
  ],
  "animals": [],
  "inputs": ["compost_poules", "eau_pluie"],
  "outputs": ["legumes_hiver", "proteines_vegetales"]
}
```

Le panneau latéral doit résoudre les IDs avec `plants.json`.

---

## 9. MVP 6 — rotations

Créer un fichier `rotations.json` ou intégrer dans `zones.json`.

Exemple :

```json
{
  "zone2_parcelle_a": {
    "year1": "racines_legumineuses",
    "year2": "fruits_choux",
    "year3": "jachere_poules",
    "year4": "racines_legumineuses"
  }
}
```

Interface :
- bouton Année 1 / Année 2 / Année 3 / Année 4
- les labels des parcelles changent
- les plantes changent
- les tâches changent

---

## 10. MVP 7 — calculs simples

Ajouter des calculs dans le panneau.

Pour chaque plante :

```text
production = nombrePlants × rendementKgParPlant
surface = nombrePlants × espacementM2
```

Pour une zone :

```text
production zone = somme productions plantes
```

Pour un ingrédient :

```text
couverture = production / besoin annuel
```

Exemple affichage :

```text
Tomates :
40 plants × 4 kg = 160 kg/an

Surface :
40 × 0.5 m² = 20 m²

Besoin annuel estimé :
120 kg

Statut :
+40 kg excédent
```

---

## 11. MVP 8 — stockages et transformations

Créer deux fichiers.

`storage.json`

```json
[
  {
    "id": "cave_naturelle",
    "name": "Cave / frigo naturel",
    "capacityKg": 1200,
    "items": ["pommes", "pommes_de_terre", "carottes", "betteraves", "bocaux"]
  }
]
```

`transformations.json`

```json
[
  {
    "id": "paprika_fume",
    "input": "poivron_paprika",
    "output": "paprika_fume",
    "zone": "zone1_sechoir",
    "weeks": [34,35,36],
    "ratio": "10 kg poivrons frais -> 1 kg poudre"
  }
]
```

Le site doit afficher :
- où va une récolte
- ce qui est séché
- ce qui est stocké
- ce qui nourrit les animaux
- ce qui part en cuisine

---

## 12. MVP 9 — mode recette

Plus tard, ajouter :
- choix d’une recette
- affichage des ingrédients
- mise en surbrillance des zones productrices
- détection des ingrédients manquants

Exemple :

```json
{
  "id": "tarte_champignons_thym",
  "name": "Tarte champignons-thym",
  "season": "hiver",
  "ingredients": [
    {"id": "farine", "quantityG": 250},
    {"id": "beurre", "quantityG": 125},
    {"id": "oeuf", "quantity": 2},
    {"id": "champignons", "quantityG": 400},
    {"id": "thym", "quantityG": 5}
  ]
}
```

Quand on sélectionne la recette :
- champignons → zone3 champignons / cave
- thym → zone1 aromatiques
- œufs → zone2 poulailler
- beurre → zone3 vaches
- farine → petite parcelle céréale ou achat local si non produit

---

## 13. UI recommandée

Disposition :

```text
┌────────────────────────────────────────────────────────┐
│ Header : Domaine permaculture — Semaine [slider]       │
├───────────────────────────────┬────────────────────────┤
│                               │ Panneau latéral        │
│ Carte SVG                     │ Détails zone           │
│                               │ Plantes / animaux      │
│                               │ Tâches / flux          │
├───────────────────────────────┴────────────────────────┤
│ Barre filtres : eau | fertilité | récoltes | animaux    │
└────────────────────────────────────────────────────────┘
```

Filtres :
- afficher flux eau
- afficher flux fertilité
- afficher flux nourriture
- afficher flux récolte
- afficher stockages
- afficher tâches de la semaine
- afficher animaux
- afficher plantes

---

## 14. Couleurs recommandées

Types de zones :
- habitat : beige
- eau/aquaponie : bleu
- aromatiques : vert foncé
- maraîchage : vert clair
- verger : vert olive
- animaux : brun clair
- stockage : gris
- transformation : orange
- champignons : violet/gris
- mellifères : jaune

États semaine :
- semis : bleu clair
- plantation : vert vif
- entretien : jaune
- récolte : orange
- repos/jachère : brun
- stockage : gris

---

## 15. Étapes concrètes de développement

### Étape 1
Créer `index.html`, `styles.css`, `app.js`.

### Étape 2
Dessiner SVG statique avec 10 zones.

### Étape 3
Ajouter clic sur zone + panneau latéral.

### Étape 4
Déplacer les données vers `zones.json`.

### Étape 5
Ajouter `plants.json`, `animals.json`.

### Étape 6
Ajouter slider semaine 1–56.

### Étape 7
Ajouter `calendar56.json`.

### Étape 8
Ajouter les flux entre zones.

### Étape 9
Ajouter calculs de production.

### Étape 10
Ajouter transformations et stockages.

### Étape 11
Ajouter mode recette.

### Étape 12
Remplacer les rectangles par un dessin plus beau si besoin.

---

## 16. Version future possible

Quand le modèle SVG fonctionne, migrer vers :
- React + SVG pour interface plus propre
- React + PixiJS pour rendu plus fluide
- Phaser si tu veux une vraie dimension jeu
- Three.js uniquement si la 3D devient vraiment nécessaire

Recommandation :
- commencer SVG pur
- stabiliser les données
- migrer ensuite seulement si le besoin visuel est confirmé

---

## 17. Premier objectif réaliste

Version 0.1 :
- une carte SVG
- 15 zones
- panneau latéral
- slider semaine
- quelques flux
- 20 plantes
- 5 animaux/systèmes
- 30 tâches calendaires

Version 0.2 :
- 80 plantes
- rotations
- stockages
- transformations
- recettes

Version 1.0 :
- calcul de production
- autonomie alimentaire
- menus saisonniers
- exports JSON/CSV
- rendu plus visuel
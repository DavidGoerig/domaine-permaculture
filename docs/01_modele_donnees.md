# Modèle de données — Domaine permaculture + Earthship + table d’hôtes

Objectif : définir toutes les données nécessaires pour représenter le domaine dans un futur site SVG interactif, puis calculer les surfaces, productions, flux, rotations, besoins, tâches hebdomadaires et liens avec la cuisine.

Ce modèle est conçu pour être transformé ensuite en fichiers :
- `zones.json`
- `plants.json`
- `animals.json`
- `flows.json`
- `calendar56.json`
- `storage.json`
- `transformations.json`
- `recipes.json`

---

## 1. Vue globale du domaine

### Zone 1 — Maison Earthship + systèmes intensifs

Contenu :
- maison Earthship
- serre intégrée sud
- serre semis
- serre séchoir solaire
- frigo naturel / cave enterrée
- puits canadien
- aquaponie à truites avec 4 bassins communiquants
- bacs aromatiques
- bacs salades hivernales
- stockage graines / terreau / argile / eau
- cuisine / transformation / séchage / stockage

Rôle :
- autonomie habitat
- production rapide et quotidienne
- transformation
- stockage
- semis / plants
- assaisonnements
- salades
- poisson

### Zone 2 — Cœur maraîcher + poulailler central

Structure :
- grand carré divisé en 4 parcelles clôturées
- poulailler central ouvrable vers chaque parcelle
- 1 parcelle verger fixe avec pommiers + fraises au sol
- 2 parcelles productives principales
- 1 parcelle en jachère active / poules / engrais verts
- coins vivaces fixes : asperges, rhubarbe, artichauts

Rôle :
- légumes principaux
- rotation des cultures
- fertilisation par poules
- production d’œufs
- nettoyage des parcelles
- diversité maraîchère

### Zone 3 — Vaches + extensif + noyers

Contenu :
- pâturage tournant pour vaches
- noyers
- plantes sauvages comestibles
- plantes mellifères
- structures champignons en bois
- mini-parcelles rustiques si besoin

Rôle :
- lait
- beurre
- crème
- fumier
- noix / huile de noix
- biodiversité
- champignons
- fourrage / foin

### Entre les zones

Contenu :
- haies de mûres, framboises, cassis, groseilles
- palissades bois / rondins percés pour champignons en zones ombragées
- chemins techniques pour  facilement naviguer entrre chaque zone / optimise les déplacements
- flux visibles : eau, compost, nourriture animale, récoltes, transformation, stockage

---

## 2. Entités principales à modéliser

### Zone

Champs recommandés :

```json
{
  "id": "zone1_earthship",
  "name": "Maison Earthship",
  "type": "habitat",
  "zoneNumber": 1,
  "surfaceM2": 180,
  "shape": "rect",
  "svg": {
    "x": 50,
    "y": 50,
    "width": 180,
    "height": 100
  },
  "description": "Maison passive/autonome avec serre intégrée, récupération d’eau, inertie thermique et puits canadien.",
  "inputs": ["eau_pluie", "energie_solaire", "recoltes", "lait", "oeufs"],
  "outputs": ["eaux_grises", "dechets_cuisine", "repas", "chaleur_stockee"],
  "storage": ["cuisine", "cellier"],
  "linkedZones": ["zone1_serre_integree", "zone1_cave", "zone1_sechoir"]
}
```

### Plant

```json
{
  "id": "tomate_noire_crimee",
  "name": "Tomate Noire de Crimée",
  "family": "Solanacées",
  "category": "légume fruit",
  "zoneRecommended": "zone2_parcelle_fruits_choux",
  "cropSystem": "plein_sol",
  "sowWeeks": [8,9,10,11],
  "plantWeeks": [19,20,21],
  "harvestWeeks": [28,29,30,31,32,33,34,35,36,37],
  "dailyCare": ["surveillance_arrosage", "aeration_si_serre"],
  "weeklyCare": ["tuteurage", "taille_gourmands", "controle_mildiou"],
  "yieldKgPerPlant": 4.0,
  "plantSpacingM2": 0.5,
  "culinaryUses": ["salade", "sauce", "tomates_sechees"]
}
```

### Animal

```json
{
  "id": "vaches_laitieres",
  "name": "Vaches laitières",
  "count": 1,
  "zone": "zone3_paturage",
  "inputs": ["pature", "foin", "eau", "mineraux"],
  "outputs": ["lait", "fumier", "beurre", "creme"],
  "feedSources": ["zone3_paturage", "zone3_foin"],
  "dailyCare": ["traite", "eau", "controle_sante"],
  "weeklyCare": ["rotation_paturage", "nettoyage_zone"],
  "yearlyProduction": {
    "milkLiters": 2500,
    "manureKg": 8000
  }
}
```

### Flow

```json
{
  "id": "fumier_vaches_vers_compost",
  "from": "zone3_paturage",
  "to": "zone2_compost",
  "type": "nutrient",
  "items": ["fumier"],
  "activeWeeks": [1,2,3,4,5,6,7,8,9,10,11,12],
  "description": "Le fumier des vaches est transféré vers le compost, puis utilisé sur les parcelles maraîchères."
}
```

### CalendarTask

```json
{
  "id": "semis_tomates",
  "week": 9,
  "zone": "zone1_serre_semis",
  "target": "tomate",
  "taskType": "semis",
  "description": "Semer les tomates anciennes sur tables hautes en serre semis.",
  "durationHours": 2,
  "priority": "high"
}
```

---

## 3. Zone 1 détaillée

### Zone 1.1 — Maison Earthship

Caractéristiques :
- murs à forte inertie thermique
- façade sud vitrée
- serre intégrée
- récupération d’eau de pluie
- filtration
- réutilisation des eaux grises
- ventilation naturelle
- puits canadien
- stockage alimentaire proche cuisine

Inputs :
- eau de pluie
- énergie solaire
- air tempéré via puits canadien
- récoltes fraîches
- œufs
- lait
- poissons
- aromatiques
- bois / biomasse ponctuelle

Outputs :
- repas
- eaux grises
- déchets cuisine
- chaleur stockée
- compost potentiel
- besoins vers stockage / transformation

Besoins :
- isolation
- ventilation
- entretien filtration eau
- entretien batteries / panneaux
- suivi humidité

### Zone 1.2 — Serre semis

Composition :
- tables hautes
- armoires à graines
- accès terreau
- argile
- eau
- zone de bouturage
- zone de repiquage

Plants concernés :
- tomates
- aubergines
- poivrons
- choux
- laitues de printemps
- basilic
- vivaces à bouturer

Inputs :
- graines
- terreau
- argile
- eau
- chaleur solaire
- étiquettes / plateaux

Outputs :
- plants prêts à repiquer
- boutures enracinées

Tâches :
- semis
- arrosage fin
- repiquage
- durcissement des plants
- inventaire graines

### Zone 1.3 — Serre séchoir solaire

Composition :
- mur chauffant
- tiroirs de séchage
- compartiment herbes
- compartiment fruits
- compartiment champignons
- ventilation naturelle ou solaire
- option fumage léger pour paprika

À sécher :
- tomates
- courgettes
- champignons
- pommes
- poires
- prunes
- thym
- romarin
- sauge
- origan
- menthe
- mélisse
- verveine
- piments
- poivrons pour paprika

Produits transformés :
- tomates séchées
- paprika fumé
- poudre de piment
- mélanges d’herbes
- infusions
- fruits secs
- champignons secs

### Zone 1.4 — Frigo naturel / cave

Inputs :
- air frais du sol
- récoltes de stockage
- bocaux
- produits fermentés

Outputs :
- légumes conservés
- fruits conservés
- lactofermentations
- beurre / fromage / lait au frais si conditions adaptées

Stockage :
- pommes
- poires
- pommes de terre
- carottes en sable
- betteraves
- courges
- bocaux
- noix
- farines

### Zone 1.5 — Aquaponie 4 bassins

Principe :
- 4 bassins communiquants
- truites
- filtration mécanique
- filtration biologique
- tables de culture pour légumes rapides
- retour eau

Ne pas mettre d’aromatiques ici.

À cultiver :
- laitue pommée
- batavia
- feuille de chêne
- romaine
- sucrine
- roquette
- jeunes épinards
- mizuna
- moutarde asiatique
- pak choï
- cresson si système adapté
- jeunes pousses de brassicacées

Périodes :
- printemps : très bon
- été : attention chaleur, ombrage nécessaire
- automne : très bon
- hiver : possible sous serre selon température et lumière

Inputs :
- nourriture truites
- eau
- énergie pompe
- oxygénation
- semences / plants

Outputs :
- truites
- salades
- légumes feuilles rapides
- eau fertilisée

Besoins :
- eau fraîche
- oxygénation
- contrôle ammoniaque/nitrites/nitrates
- ombrage été
- surveillance poissons

### Zone 1.6 — Bacs aromatiques

Règle : toutes les aromatiques restent ici.

#### Bac A — Méditerranéennes sèches
Même bac, substrat très drainant.
- thym commun
- thym citron
- romarin
- sauge officinale
- origan grec
- sarriette

#### Bac B — Fraîches humides
Même bac, sol riche et arrosage régulier.
- persil plat
- persil frisé
- ciboulette
- coriandre feuille
- aneth
- cerfeuil

#### Bac C — Basilics
Bac dédié.
- basilic Genovese
- basilic citron
- basilic pourpre
- basilic thaï si climat/serre

#### Bac D — Menthes isolées
Bac séparé obligatoire.
- menthe verte
- menthe poivrée
- menthe chocolat
- menthe marocaine

#### Bac E — Gastronomiques
Bacs dédiés ou mini-bacs.
- estragon
- livèche
- hysope
- mélisse
- verveine citronnelle
- bourrache comestible
- pimprenelle

#### Bac F — Condiments / épices locales
- moutarde
- piment fort
- fenouil
- coriandre graine
- carvi
- cumin des prés si adapté

### Zone 1.7 — Bacs salades hivernales

À cultiver :
- mâche
- épinard d’hiver
- laitue d’hiver
- claytone de Cuba
- chicorée pain de sucre
- scarole
- frisée
- cresson alénois
- pourpier d’hiver

Rôle :
- sécuriser les salades qui ne poussent pas bien en aquaponie en période froide
- production très proche cuisine

---

## 4. Zone 2 détaillée

### Zone 2.0 — Poulailler central

Fonction :
- accès contrôlé aux 4 parcelles
- fertilisation
- nettoyage après récolte
- réduction insectes / limaces
- production œufs

Inputs :
- grains
- restes cuisine sélectionnés
- eau
- parcours
- coquilles broyées
- compléments minéraux

Outputs :
- œufs
- fumier
- litière compostable
- viande ponctuelle

Flux :
- fumier → compost
- poules → jachère
- déchets légumes → poules
- coquilles → sol / poules

### Zone 2.1 — Parcelle fixe verger + poules

Arbres :
- pommiers Reinette
- pommiers Belle de Boskoop
- pommiers Calville
- pommiers Canada gris

Sous-étage :
- fraises
- trèfle blanc
- éventuellement consoude en bordure pour biomasse

Rôle :
- fruits
- ombre
- parcours poules
- fertilité

### Zone 2.2 — Parcelle productive A : racines + légumineuses

Racines :
- carotte Jaune du Doubs
- carotte Rouge Sang
- carotte Blanche de Kuttingen
- betterave Chioggia
- betterave Crapaudine
- panais de Guernesey
- navet boule d’or
- navet violet
- radis noir
- radis rose de Chine
- rutabaga
- salsifis
- scorsonère
- céleri-rave

Légumineuses :
- pois mangetout
- pois à écosser
- fèves
- haricots verts
- haricots secs type coco
- haricot tarbais
- lentilles petite surface

### Zone 2.3 — Parcelle productive B : légumes fruits + choux + diversité

Légumes fruits :
- tomate Noire de Crimée
- tomate Ananas
- tomate Cœur de Bœuf
- tomate Green Zebra
- tomate Roma pour sauce
- courgette verte
- courgette jaune
- tromboncino
- aubergine Violette longue
- aubergine Listada de Gandia
- poivron Corne de Taureau
- poivron paprika hongrois
- concombre
- cornichon
- melon si climat/serre tunnel

Choux :
- chou kale
- chou cabus
- chou rouge
- chou de Bruxelles
- chou-fleur
- brocoli
- chou-rave
- chou de Milan
- pak choï hors aquaponie si besoin

Autres légumes:
- poireau
- fenouil bulbe
- cardon
- arroche
- tétragone
- blette
- épinard pleine terre
- laitues pleine terre d’été
- céleri branche

### Zone 2.4 — Parcelle jachère active + poules

Contenu :
- phacélie
- trèfle
- moutarde
- seigle engrais vert
- vesce
- sarrasin
- luzerne si besoin

Rôle :
- repos du sol
- nourriture partielle poules
- biomasse
- azote
- pollinisateurs
- nettoyage par poules

### Zone 2.5 — Coins vivaces fixes

À placer en bordure ou coin non retourné.
- asperges
- rhubarbe
- artichauts
- topinambours si contrôlés
- oseille
- chénopode bon-Henri
- poireau perpétuel
- oignon rocambole
- ail rocambole

---

## 5. Zone 3 détaillée

### Zone 3.1 — Pâturage vaches

Animaux :
- 1 petite vache laitière au départ
- races possibles : Jersey, Bretonne Pie Noir, Vosgienne

Productions :
- lait
- crème
- beurre
- fromage
- fumier

Inputs :
- pâture
- foin
- eau
- minéraux
- abri

Outputs :
- lait
- fumier
- entretien prairie

Flux :
- lait → cuisine / fromagerie / beurre
- fumier → compost
- foin → stockage hivernal
- herbe → alimentation vache

### Zone 3.2 — Noyers

Arbres :
- noyers uniquement selon choix actuel

Usages :
- noix
- huile de noix
- desserts
- sauces
- stockage sec

Attention :
- le noyer produit de la juglone, ce qui limite certaines plantes sous sa couronne.
- prévoir espacement et zone adaptée.

### Zone 3.3 — Champignons extérieurs

Supports :
- rondins de bois percés
- palissades bois
- bûches à l’ombre
- zones humides protégées

Types :
- shiitake
- pleurote

### Zone 3.4 — Sauvage comestible

À favoriser :
- ortie
- pissenlit
- plantain
- ail des ours
- berce
- oxalis
- lierre terrestre si présent
- alliaire
- reine-des-prés si zone humide

### Zone 3.5 — Plantes mellifères

- phacélie
- trèfle
- lavande
- bourrache
- sainfoin
- mélilot
- lotier
- cosmos
- souci
- bleuet

---

## 6. Haies et bordures entre zones

Fruits :
- mûres
- framboises
- cassis
- groseilles
- caseille
- sureau
- églantier
- argousier si adapté
- prunellier en haie sauvage

Outputs :
- fruits frais
- confitures
- sirops
- desserts
- haies défensives
- abri biodiversité

---

## 7. Flux principaux à afficher dans le futur site

### Flux eau
- pluie → cuves Earthship
- cuves → maison
- cuves → serre semis
- cuves → bacs
- aquaponie → circuit fermé

### Flux fertilité
- poules → fumier → compost → parcelles zone 2
- vaches → fumier → compost → zone 2 / verger
- déchets cuisine → compost / poules
- engrais verts → sol

### Flux nourriture animale
- pâture → vaches
- foin → vaches hiver
- restes légumes → poules
- grains → poules
- alimentation truites → aquaponie

### Flux cuisine
- zone 1 aromatiques → cuisine / séchoir
- zone 1 aquaponie → cuisine
- zone 2 légumes → cuisine / cave / séchoir
- zone 3 lait → cuisine / beurre / fromage
- zone 3 noix → stockage / huile
- haies fruitières → cuisine / confiture

### Flux transformation
- herbes → séchoir → bocaux
- poivrons → fumage/séchage → paprika
- piments → séchoir → poudre
- tomates → séchoir → tomates séchées
- fruits → séchoir / confiture / cave
- lait → beurre / crème / fromage
- noix → huile / stockage
- champignons → séchoir / cuisine

---

## 8. Calendrier agricole sur 56 semaines

Utiliser 56 semaines plutôt que 52 permet :
- 52 semaines réelles
- 4 semaines tampon pour planification, retard météo, maintenance, bilan

### Semaines 1 à 8 — hiver / préparation

- planifier les rotations
- commander / trier graines
- entretenir outils
- tailler pommiers
- entretenir noyers
- contrôler cave / stocks
- produire champignons en espace contrôlé
- préparer terreau / tables de serre semis
- vérifier aquaponie
- récolter légumes stockés
- soins quotidiens vaches/poules/truites

### Semaines 9 à 16 — semis intensifs

- semer tomates, aubergines, poivrons en serre semis
- semer choux précoces
- semer salades
- préparer bacs aromatiques
- bouturer romarin / thym / menthe / basilic
- semer carottes, panais, pois, fèves selon météo
- démarrer nouvelles cultures aquaponie
- surveiller jeunes plants quotidiennement

### Semaines 17 à 24 — plantation / mise en place

- planter pommes de terre
- repiquer choux
- planter tomates / aubergines / poivrons après gelées
- installer tuteurs
- semer haricots
- semer courgettes / concombres
- mettre en place paillage
- ouvrir parcelle jachère aux poules après sécurisation
- planter / entretenir aromatiques
- lancer premières récoltes de salades

### Semaines 25 à 32 — pleine croissance

- arroser / pailler
- tailler tomates
- surveiller maladies
- récolter salades
- récolter pois / fèves
- récolter premières courgettes
- sécher herbes
- gérer aquaponie avec attention chaleur
- rotation pâturage vaches
- entretenir mellifères / ruches si intégrées

### Semaines 33 à 40 — récoltes d’été / transformation

- récolter tomates
- sécher tomates
- récolter poivrons/piments
- faire paprika fumé
- récolter aubergines/courgettes
- récolter fruits rouges tardifs
- commencer pommes précoces
- récolter haricots secs
- récolter champignons si cycles actifs
- préparer lactofermentations

### Semaines 41 à 48 — automne / stockage

- récolter courges
- récolter pommes
- récolter noix
- récolter racines
- mettre en cave
- faire compotes / confitures
- semer engrais verts
- ouvrir parcelles finies aux poules
- planter ail / échalotes
- nettoyer aquaponie
- préparer bacs salades hiver

### Semaines 49 à 56 — hiver / bilan / maintenance

- bilan productions
- ajuster surfaces
- réparer clôtures
- entretenir serres
- gérer stocks
- nourrir animaux
- produire champignons
- planifier recettes hiver
- préparer rotations année suivante

---

## 9. Soins quotidiens par système

### Vaches
- eau
- pâture / foin
- traite
- contrôle santé
- nettoyage zone traite
- surveillance clôtures

### Poules
- eau
- alimentation
- collecte œufs
- ouverture/fermeture parcours
- contrôle prédateurs
- litière

### Truites / aquaponie
- nourrir
- contrôle oxygène
- contrôle température
- observation comportement
- vérification pompe
- contrôle niveau eau

### Serre semis
- arrosage fin
- aération
- contrôle température
- contrôle levée
- étiquetage

### Bacs aromatiques
- arrosage selon groupe
- taille légère
- récolte régulière
- surveillance maladies

---

## 10. Calculs à prévoir

### Surface par culture

```text
surface nécessaire = besoin annuel kg / rendement kg par m²
```

### Nombre de plants

```text
nombre de plants = besoin annuel kg / rendement kg par plant
```

### Production totale d’une zone

```text
production zone = somme(production culture)
```

### Autonomie

```text
autonomie % = production interne / besoin total
```
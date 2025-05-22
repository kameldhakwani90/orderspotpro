// src/lib/amenities.ts
import type { AmenityCategory } from './types';
import { Bed, Bath, Wifi, Wind, Utensils, Coffee, Tv, ParkingCircle, ConciergeBell, ThermometerSnowflake, Sun, PawPrint, TreePine, Waves, Mountain, ShieldCheck, Bell, Dumbbell, Refrigerator, Archive, CircleUser, CalendarDays } from 'lucide-react';

export const PREDEFINED_AMENITIES: AmenityCategory[] = [
  {
    categoryLabel: "Vues",
    options: [
      { id: "vue-riviere", label: "Vue sur la rivière", icon: Waves },
      { id: "vue-parc", label: "Vue sur le parc", icon: TreePine },
      { id: "vue-montagne", label: "Vue sur la montagne", icon: Mountain },
      { id: "vue-mer", label: "Vue sur la mer", icon: Waves },
    ]
  },
  {
    categoryLabel: "Salle de bain",
    options: [
      { id: "salle-de-bain", label: "Salle de bain privée", icon: Bath },
      { id: "seche-cheveux", label: "Sèche-cheveux", icon: Wind },
      { id: "produits-nettoyage", label: "Produits de nettoyage", icon: Bath },
      { id: "shampooing", label: "Shampooing", icon: Bath },
      { id: "apres-shampooing", label: "Après-shampoing", icon: Bath },
      { id: "gel-douche", label: "Gel douche", icon: Bath },
    ]
  },
  {
    categoryLabel: "Chambre et linge",
    options: [
      { id: "cintres", label: "Cintres", icon: Archive },
      { id: "draps", label: "Draps", icon: Bed },
      { id: "linge-lit-coton", label: "Linge de lit en coton", icon: Bed },
      { id: "etendoir-linge", label: "Étendoir à linge", icon: Archive },
      { id: "rangement-vetements", label: "Espace de rangement pour les vêtements", icon: Archive },
    ]
  },
  {
    categoryLabel: "Chauffage et climatisation",
    options: [
      { id: "chauffage-central", label: "Chauffage central", icon: ThermometerSnowflake },
      { id: "climatisation", label: "Climatisation", icon: Wind },
    ]
  },
  {
    categoryLabel: "Vie privée et sécurité",
    options: [
      { id: "serrure-porte-chambre", label: "Serrure ou verrou sur la porte de la chambre", icon: ShieldCheck },
      { id: "detecteur-fumee", label: "Détecteur de fumée", icon: Bell },
    ]
  },
  {
    categoryLabel: "Internet et bureau",
    options: [
      { id: "wifi", label: "Wifi", icon: Wifi },
      { id: "espace-travail-dedie", label: "Espace de travail dédié", icon: CircleUser },
    ]
  },
  {
    categoryLabel: "Cuisine et salle à manger",
    options: [
      { id: "cuisine", label: "Cuisine", icon: Utensils },
      { id: "espace-cuisine-voyageurs", label: "Espace où les voyageurs peuvent cuisiner", icon: Utensils },
      { id: "micro-ondes", label: "Four à micro-ondes", icon: Refrigerator },
      { id: "equipements-cuisine-base", label: "Équipements de cuisine de base (Casseroles, huile, sel et poivre)", icon: Utensils },
      { id: "congelateur", label: "Congélateur", icon: Refrigerator },
      { id: "bouilloire-electrique", label: "Bouilloire électrique", icon: Coffee },
      { id: "grille-pain", label: "Grille-pain", icon: Utensils },
      { id: "cuiseur-riz", label: "Cuiseur à riz", icon: Utensils },
      { id: "table-manger", label: "Table à manger", icon: Utensils },
      { id: "machine-pain", label: "Machine à pain", icon: Utensils },
    ]
  },
  {
    categoryLabel: "Caractéristiques de l'emplacement",
    options: [
      { id: "laverie-auto-proximite", label: "Laverie automatique à proximité", icon: Archive },
    ]
  },
  {
    categoryLabel: "Parking et installations",
    options: [
      { id: "parking-gratuit-sur-place", label: "Parking gratuit sur place", icon: ParkingCircle },
      { id: "ascenseur", label: "Ascenseur", icon: ParkingCircle },
    ]
  },
  {
    categoryLabel: "Services",
    options: [
      { id: "animaux-acceptes", label: "Animaux acceptés", icon: PawPrint },
      { id: "sejours-longue-duree", label: "Séjours longue durée autorisés", icon: CalendarDays },
      { id: "cles-remises-hote", label: "Clés remises par l'hôte", icon: CircleUser },
      { id: "petit-dejeuner-inclus", label: "Petit déjeuner inclus", icon: Coffee },
    ]
  },
  {
    categoryLabel: "Équipements supplémentaires",
    options: [
        { id: "tv", label: "Télévision", icon: Tv },
        { id: "fer-repasser", label: "Fer à repasser", icon: Archive },
        { id: "piscine", label: "Piscine", icon: Waves },
        { id: "jacuzzi", label: "Jacuzzi", icon: Waves },
        { id: "salle-sport", label: "Salle de sport", icon: Dumbbell },
        { id: "terrasse-balcon", label: "Terrasse ou Balcon", icon: Sun },
    ]
  }
];

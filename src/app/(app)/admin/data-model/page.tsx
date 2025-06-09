
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Users, Building, MapPin, ListChecks, FileText, ClipboardList, ShoppingCart, CalendarCheck, Tag as TagIcon, Utensils, Briefcase } from "lucide-react";

interface EntityField {
  name: string;
  type: string;
  description?: string;
}

interface DataEntity {
  name: string;
  icon: React.ElementType;
  description: string;
  fields: EntityField[];
}

const dataModel: DataEntity[] = [
  {
    name: "User (Utilisateur)",
    icon: Users,
    description: "Représente un utilisateur du système (admin, hôte, client).",
    fields: [
      { name: "id", type: "string", description: "Identifiant unique" },
      { name: "email", type: "string", description: "Adresse e-mail (login)" },
      { name: "nom", type: "string", description: "Nom complet" },
      { name: "role", type: "UserRole ('admin', 'host', 'client')", description: "Rôle de l'utilisateur" },
      { name: "hostId", type: "string (optionnel)", description: "ID de l'hôte si rôle = 'host'" },
    ],
  },
  {
    name: "Host (Hôte/Établissement Principal)",
    icon: Briefcase,
    description: "Représente une entité gestionnaire (ex: un groupe hôtelier).",
    fields: [
      { name: "hostId", type: "string", description: "Identifiant unique de l'hôte" },
      { name: "nom", type: "string", description: "Nom de l'établissement hôte" },
      { name: "email", type: "string", description: "Email de contact de l'hôte" },
      { name: "currency", type: "string (optionnel)", description: "Devise par défaut (ex: EUR, USD)" },
      { name: "language", type: "string (optionnel)", description: "Langue par défaut (ex: fr, en)" },
      { name: "reservationPageSettings", type: "object (optionnel)", description: "Paramètres de la page de réservation publique" },
      { name: "loyaltySettings", type: "object (optionnel)", description: "Paramètres du programme de fidélité" },
    ],
  },
  {
    name: "Site (Site Global)",
    icon: Building,
    description: "Représente un établissement physique individuel (ex: Hôtel Paradis, Restaurant Le Phare) géré par un Hôte.",
    fields: [
      { name: "siteId", type: "string", description: "Identifiant unique du site global" },
      { name: "nom", type: "string", description: "Nom du site (ex: Hôtel de la Plage)" },
      { name: "hostId", type: "string", description: "ID de l'Hôte qui gère ce site" },
      { name: "logoUrl", type: "string (optionnel)", description: "URL du logo du site" },
      { name: "primaryColor", type: "string (optionnel)", description: "Couleur principale (HEX)" },
    ],
  },
  {
    name: "RoomOrTable (Lieu/Emplacement)",
    icon: MapPin,
    description: "Représente une chambre, une table, ou une zone (Site) spécifique au sein d'un Site Global.",
    fields: [
      { name: "id", type: "string", description: "Identifiant unique du lieu" },
      { name: "nom", type: "string", description: "Nom du lieu (ex: Chambre 101, Table 5, Terrasse Piscine)" },
      { name: "type", type: "'Chambre' | 'Table' | 'Site'", description: "Type de lieu" },
      { name: "hostId", type: "string", description: "ID de l'Hôte parent" },
      { name: "globalSiteId", type: "string", description: "ID du Site Global parent" },
      { name: "parentLocationId", type: "string (optionnel)", description: "ID du Lieu parent (pour hiérarchie)" },
      { name: "capacity", type: "number (optionnel)", description: "Capacité (personnes)" },
      { name: "prixParNuit", type: "number (optionnel)", description: "Pour les Chambres" },
      { name: "prixFixeReservation", type: "number (optionnel)", description: "Pour les Tables" },
      { name: "tagIds", type: "string[] (optionnel)", description: "IDs des Tags associés" },
      { name: "menuCardId", type: "string (optionnel)", description: "ID de la carte de menu associée" },
    ],
  },
  {
    name: "Tag",
    icon: TagIcon,
    description: "Étiquettes pour qualifier les lieux (ex: Vue Mer, Calme).",
    fields: [
      { name: "id", type: "string", description: "Identifiant unique" },
      { name: "name", type: "string", description: "Nom du tag" },
      { name: "hostId", type: "string", description: "ID de l'hôte propriétaire du tag" },
    ],
  },
  {
    name: "ServiceCategory (Catégorie de Service)",
    icon: ListChecks,
    description: "Catégories pour organiser les services (ex: Petit Déjeuner, Activités).",
    fields: [
      { name: "id", type: "string", description: "Identifiant unique" },
      { name: "nom", type: "string", description: "Nom de la catégorie" },
      { name: "hostId", type: "string", description: "ID de l'hôte propriétaire" },
      { name: "image", type: "string (optionnel)", description: "URL de l'image de la catégorie" },
    ],
  },
  {
    name: "CustomForm (Formulaire Personnalisé)",
    icon: FileText,
    description: "Formulaires pour collecter des informations spécifiques pour certains services.",
    fields: [
      { name: "id", type: "string", description: "Identifiant unique" },
      { name: "nom", type: "string", description: "Nom du formulaire" },
      { name: "hostId", type: "string", description: "ID de l'hôte propriétaire" },
    ],
  },
  {
    name: "FormField (Champ de Formulaire)",
    icon: FileText, // Reuse, or find more specific one
    description: "Champs individuels composant un Formulaire Personnalisé.",
    fields: [
      { name: "id", type: "string", description: "Identifiant unique" },
      { name: "formulaireId", type: "string", description: "ID du formulaire parent" },
      { name: "label", type: "string", description: "Intitulé du champ" },
      { name: "type", type: "FormFieldTypeOption", description: "Type de champ (text, number, date, etc.)" },
      { name: "obligatoire", type: "boolean", description: "Champ requis ?" },
      { name: "ordre", type: "number", description: "Ordre d'affichage" },
    ],
  },
  {
    name: "Service (Service Général)",
    icon: ClipboardList,
    description: "Services généraux proposés (ex: Navette Aéroport, Massage).",
    fields: [
      { name: "id", type: "string", description: "Identifiant unique" },
      { name: "titre", type: "string", description: "Titre du service" },
      { name: "categorieId", type: "string", description: "ID de la catégorie de service" },
      { name: "hostId", type: "string", description: "ID de l'hôte propriétaire" },
      { name: "prix", type: "number (optionnel)", description: "Prix du service" },
      { name: "formulaireId", type: "string (optionnel)", description: "ID du formulaire associé" },
      { name: "targetLocationIds", type: "string[] (optionnel)", description: "Lieux ciblés par le service" },
    ],
  },
  {
    name: "MenuCard (Carte de Menu)",
    icon: Utensils,
    description: "Conteneur principal pour les menus (ex: Menu du Soir, Carte des Vins).",
    fields: [
      { name: "id", type: "string", description: "Identifiant unique" },
      { name: "name", type: "string", description: "Nom de la carte" },
      { name: "hostId", type: "string", description: "ID de l'hôte propriétaire" },
      { name: "globalSiteId", type: "string", description: "ID du Site Global auquel la carte est liée" },
      { name: "isActive", type: "boolean", description: "Carte active ou non" },
    ],
  },
  {
    name: "MenuCategory (Catégorie de Menu)",
    icon: Utensils,
    description: "Sections d'une carte de menu (ex: Entrées, Plats Principaux, Desserts).",
    fields: [
      { name: "id", type: "string", description: "Identifiant unique" },
      { name: "name", type: "string", description: "Nom de la catégorie de menu" },
      { name: "menuCardId", type: "string", description: "ID de la carte de menu parente" },
      { name: "hostId", type: "string", description: "ID de l'hôte propriétaire" },
      { name: "displayOrder", type: "number (optionnel)", description: "Ordre d'affichage" },
    ],
  },
  {
    name: "MenuItem (Article de Menu)",
    icon: Package,
    description: "Articles individuels d'une catégorie de menu (ex: Pizza Margherita, Coca-Cola).",
    fields: [
      { name: "id", type: "string", description: "Identifiant unique" },
      { name: "name", type: "string", description: "Nom de l'article" },
      { name: "price", type: "number", description: "Prix de base de l'article" },
      { name: "menuCategoryId", type: "string", description: "ID de la catégorie de menu parente" },
      { name: "hostId", type: "string", description: "ID de l'hôte propriétaire" },
      { name: "isConfigurable", type: "boolean (optionnel)", description: "Article configurable avec options ?" },
      { name: "optionGroups", type: "MenuItemOptionGroup[] (optionnel)", description: "Groupes d'options pour articles configurables" },
      { name: "stock", type: "number (optionnel)", description: "Quantité en stock" },
    ],
  },
  {
    name: "Order (Commande)",
    icon: ShoppingCart,
    description: "Représente une commande de service ou d'article de menu.",
    fields: [
      { name: "id", type: "string", description: "Identifiant unique" },
      { name: "serviceId", type: "string", description: "ID du Service ou MenuItem commandé" },
      { name: "hostId", type: "string", description: "ID de l'hôte" },
      { name: "chambreTableId", type: "string", description: "ID du lieu de la commande" },
      { name: "clientNom", type: "string (optionnel)", description: "Nom du client" },
      { name: "userId", type: "string (optionnel)", description: "ID de l'utilisateur client" },
      { name: "status", type: "OrderStatus", description: "Statut (pending, confirmed, etc.)" },
      { name: "prixTotal", type: "number (optionnel)", description: "Prix total de la commande" },
    ],
  },
  {
    name: "Client (Fiche Client Hôte)",
    icon: Users,
    description: "Fiche client spécifique à un hôte, pour les clients hébergés ou de passage.",
    fields: [
      { name: "id", type: "string", description: "Identifiant unique de la fiche client" },
      { name: "hostId", type: "string", description: "ID de l'hôte auquel cette fiche est liée" },
      { name: "nom", type: "string", description: "Nom du client" },
      { name: "email", type: "string (optionnel)" },
      { name: "type", type: "'heberge' | 'passager'", description: "Type de client" },
      { name: "credit", type: "number (optionnel)", description: "Crédit monétaire du client" },
      { name: "pointsFidelite", type: "number (optionnel)", description: "Points de fidélité" },
      { name: "userId", type: "string (optionnel)", description: "Lien vers un compte Utilisateur global" },
    ],
  },
  {
    name: "Reservation",
    icon: CalendarCheck,
    description: "Représente une réservation de chambre ou de table.",
    fields: [
      { name: "id", type: "string", description: "Identifiant unique" },
      { name: "hostId", type: "string", description: "ID de l'hôte" },
      { name: "locationId", type: "string", description: "ID du lieu réservé" },
      { name: "type", type: "'Chambre' | 'Table' (optionnel)", description: "Type de lieu réservé" },
      { name: "clientName", type: "string (optionnel)", description: "Nom du client" },
      { name: "dateArrivee", type: "string (YYYY-MM-DD)", description: "Date d'arrivée" },
      { name: "dateDepart", type: "string (YYYY-MM-DD, optionnel)", description: "Date de départ (pour chambres)" },
      { name: "status", type: "ReservationStatus", description: "Statut (pending, confirmed, etc.)" },
    ],
  },
];

export default function AdminDataModelPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Modèle de Données de l'Application</h1>
        <p className="text-lg text-muted-foreground">
          Cette page décrit les principales structures de données (entités) utilisées dans OrderSpot.pro.
          Ceci est une représentation des modèles de données en mémoire.
        </p>
      </div>

      <div className="space-y-8">
        {dataModel.map((entity) => (
          <Card key={entity.name} className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <entity.icon className="mr-3 h-7 w-7 text-primary" />
                {entity.name}
              </CardTitle>
              <CardDescription>{entity.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Nom du Champ</TableHead>
                    <TableHead className="w-[250px]">Type</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entity.fields.map((field) => (
                    <TableRow key={field.name}>
                      <TableCell className="font-mono text-sm">{field.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{field.type}</TableCell>
                      <TableCell className="text-sm">{field.description || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

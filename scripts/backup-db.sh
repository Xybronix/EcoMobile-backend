#!/bin/bash

# ==============================================================================
# Script de Sauvegarde Automatisée EcoMobile
# Fréquence recommandée : 30 minutes
# ==============================================================================

# Configuration des chemins
BACKUP_DIR="/app/backups" # Chemin à l'intérieur du conteneur ou sur le host
DATE=$(date +%Y-%m-%d)
FILENAME="backup_$DATE.sql.gz"
TEMP_FILE="/tmp/temp_db_dump.sql.gz"

# Configuration Base de données (Récupérée depuis l'URL ou fixée)
# Note: Ces valeurs doivent correspondre à votre setup MySQL
DB_USER="admin"
DB_PASS="adminpassword"
DB_NAME="backend_db"
CONTAINER_NAME="ecombdb2"

echo "--- [$(date)] Début de la sauvegarde ---"

# 1. Création du dump compressé
# On utilise docker exec pour dumper depuis le conteneur MySQL
docker exec $CONTAINER_NAME mysqldump -u$DB_USER -p$DB_PASS $DB_NAME 2>/dev/null | gzip > $TEMP_FILE

# 2. Vérification de sécurité
# On vérifie que le fichier n'est pas vide (seuil de 10 Ko)
# Cela évite d'écraser un bon backup par un backup vide en cas d'attaque ou erreur
FILESIZE=$(stat -c%s "$TEMP_FILE")

if [ $FILESIZE -gt 10000 ]; then
    # Création du dossier si besoin
    mkdir -p $BACKUP_DIR
    
    # On écrase le fichier du jour avec la version plus récente
    mv $TEMP_FILE "$BACKUP_DIR/$FILENAME"
    echo "✅ Succès : Sauvegarde $FILENAME mise à jour ($FILESIZE octets)"
    
    # 3. Externalisation (Optionnel - Nécessite rclone configuré)
    # rclone copy "$BACKUP_DIR/$FILENAME" myremote:EcoMobileBackups/ -v
    
else
    echo "❌ ALERTE : Le dump généré est anormalement petit ($FILESIZE octets)."
    echo "La sauvegarde existante n'a PAS été écrasée pour des raisons de sécurité."
    rm -f $TEMP_FILE
    exit 1
fi

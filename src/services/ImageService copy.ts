import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);
// const mkdirAsync = promisify(fs.mkdir);

export class ImageService {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(__dirname, '../../uploads');
    this.ensureUploadsDir();
  }

  private ensureUploadsDir(): void {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Sauvegarder une image base64
   */
  async saveBase64Image(base64Data: string): Promise<string> {
    try {
      // Extraire le type MIME et les données
      const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        throw new Error('Format base64 invalide');
      }

      const mimeType = matches[1];
      const data = matches[2];
      const extension = this.getExtensionFromMimeType(mimeType);
      const filename = `${uuidv4()}.${extension}`;
      const filepath = path.join(this.uploadsDir, filename);

      // Convertir base64 en buffer
      const buffer = Buffer.from(data, 'base64');

      // Vérifier la taille (max 5MB)
      if (buffer.length > 5 * 1024 * 1024) {
        throw new Error('Image trop grande (max 5MB)');
      }

      // Sauvegarder le fichier
      await writeFileAsync(filepath, buffer);

      // Retourner le chemin relatif
      return `/uploads/${filename}`;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'image:', error);
      throw error;
    }
  }

  /**
   * Sauvegarder plusieurs images base64
   */
  async saveMultipleBase64Images(images: string[]): Promise<string[]> {
    const savedPaths: string[] = [];

    for (const image of images) {
      if (image && image.startsWith('data:')) {
        try {
          const path = await this.saveBase64Image(image);
          savedPaths.push(path);
        } catch (error) {
          console.error('Erreur lors de la sauvegarde d\'une image:', error);
          // Continuer avec les autres images
        }
      } else if (image && (image.startsWith('http') || image.startsWith('/'))) {
        // Si c'est déjà une URL, la conserver
        savedPaths.push(image);
      }
    }

    return savedPaths;
  }

  /**
   * Obtenir l'URL complète d'une image
   */
  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    
    // Si c'est déjà une URL complète
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Si c'est un chemin relatif, ajouter l'URL de base
    const baseUrl = process.env.API_URL || 'http://localhost:5000';
    return `${baseUrl}${imagePath}`;
  }

  /**
   * Obtenir les URLs complètes pour plusieurs images
   */
  getImageUrls(imagePaths: string[]): string[] {
    return imagePaths
      .filter(img => img && img.trim() !== '')
      .map(img => this.getImageUrl(img));
  }

  /**
   * Supprimer une image
   */
  async deleteImage(imagePath: string): Promise<void> {
    if (!imagePath || imagePath.startsWith('http')) {
      return; // Ne pas supprimer les URLs externes
    }

    const filename = path.basename(imagePath);
    const filepath = path.join(this.uploadsDir, filename);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }

  /**
   * Supprimer plusieurs images
   */
  async deleteMultipleImages(imagePaths: string[]): Promise<void> {
    for (const imagePath of imagePaths) {
      await this.deleteImage(imagePath);
    }
  }

  /**
   * Obtenir l'extension à partir du type MIME
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg'
    };

    return extensions[mimeType] || 'jpg';
  }
}

export const imageService = new ImageService();
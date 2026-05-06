export {
  getWordPressAuthHeader,
  getWordPressCredentials,
  type WordPressCredentials,
} from "@/lib/wordpress/auth";

export {
  uploadFileToWordPress,
  WORDPRESS_UPLOAD_MAX_BYTES,
  type UploadFileOptions,
  type WordPressMediaResponse,
} from "@/lib/wordpress/upload";

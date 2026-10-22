import React from 'react';
import { FileDown } from 'lucide-react';
import { TEMPLATES } from '../constants/templates';

/**
 * ============================================================================
 * COMPONENTE: TemplateDownloads (Descarga de plantillas Excel)
 * ============================================================================
 *
 * 📌 SRP (Single Responsibility Principle):
 * Su única responsabilidad es renderizar los enlaces de descarga de las
 * plantillas. No sabe de importaciones, ni de Firebase, ni de permisos:
 * recibe las plantillas desde `constants/templates.js`.
 *
 * 📌 OCP (Open/Closed Principle):
 * Si se agrega una plantilla nueva basta con sumarla a la constante; este
 * componente no necesita cambios.
 *
 * 📌 ¿Por qué <a download> y no una función?
 * Es la forma nativa y más liviana de descargar un archivo estático servido
 * desde `public/`: no requiere estado, ni peticiones manuales, ni librerías.
 */
const TemplateDownloads = ({ templates = TEMPLATES }) => {
  if (!templates.length) return null;

  return (
    <>
      {templates.map((template) => (
        <a
          key={template.id}
          className="btn-outline btn-outline-green template-download"
          href={template.url}
          download={template.fileName}
          title={`Descargar ${template.label} (${template.fileName})`}
        >
          <FileDown size={18} />
          <span>
            {template.label}
            <small className="template-download-hint">{template.description}</small>
          </span>
        </a>
      ))}
    </>
  );
};

export default TemplateDownloads;

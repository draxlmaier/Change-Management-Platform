declare module "*.png" {
    const value: string;
    export default value;
  }
  // src/custom.d.ts
declare module "@microsoft/microsoft-graph-client";
declare module 'file-saver';
declare module 'jspdf-autotable';
// global.d.ts
import "jspdf-autotable";
declare module "jspdf" {
  interface jsPDF {
    autoTable(options: any): jsPDF;
  }
}

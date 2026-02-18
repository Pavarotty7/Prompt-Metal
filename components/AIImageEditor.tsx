
import React, { useState, useRef } from 'react';
import { Sparkles, UploadCloud, Image as ImageIcon, Loader2, Download, Wand2, RefreshCw, AlertCircle } from 'lucide-react';
import { editImageWithGemini } from '../services/geminiService';

const AIImageEditor: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImage(event.target.result as string);
          setGeneratedImage(null); // Reset generated image on new upload
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage || !prompt) return;

    setIsLoading(true);
    setError(null);

    try {
      // Extract base64 data and mime type
      const [header, base64Data] = selectedImage.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';

      const result = await editImageWithGemini(base64Data, mimeType, prompt);
      
      if (result) {
        setGeneratedImage(result);
      } else {
        setError("Não foi possível gerar a imagem. Tente refinar seu prompt.");
      }
    } catch (err) {
      console.error(err);
      setError("Ocorreu um erro ao processar a imagem. Verifique a chave de API ou tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `promptmetal-edit-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-lg mb-2">
          <Wand2 className="text-white h-8 w-8" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900">Estúdio de Design IA</h2>
        <p className="text-slate-500 max-w-lg mx-auto">
          Transforme fotos de obras e projetos usando comandos de texto. Adicione elementos, altere estilos ou remova objetos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Input */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ImageIcon size={20} className="text-purple-600" /> Imagem Original
            </h3>
            
            <div 
              className={`border-2 border-dashed rounded-xl h-80 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden bg-slate-50 ${selectedImage ? 'border-purple-300' : 'border-slate-300 hover:border-purple-400'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedImage ? (
                <img src={selectedImage} alt="Original" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="text-center p-6">
                  <UploadCloud size={48} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-600">Clique para carregar uma imagem</p>
                  <p className="text-xs text-slate-400 mt-1">JPG ou PNG (Max 5MB)</p>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
              {selectedImage && (
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                    <p className="bg-white/90 px-3 py-1 rounded-full text-xs font-bold shadow-sm">Trocar Imagem</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              O que você deseja alterar?
            </label>
            <textarea
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
              rows={3}
              placeholder="Ex: Adicione um capacete amarelo no trabalhador. / Aplique um filtro de esboço arquitetônico. / Remova os entulhos do chão."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              onClick={handleGenerate}
              disabled={!selectedImage || !prompt || isLoading}
              className={`w-full mt-4 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-md ${
                !selectedImage || !prompt || isLoading
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Processando...
                </>
              ) : (
                <>
                  <Sparkles size={20} /> Gerar Alteração
                </>
              )}
            </button>
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Output */}
        <div className="flex flex-col h-full">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Sparkles size={20} className="text-amber-500" /> Resultado Gerado
                </h3>
                
                <div className="flex-1 border-2 border-slate-100 rounded-xl bg-slate-50 flex items-center justify-center relative overflow-hidden min-h-[400px]">
                    {isLoading ? (
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-slate-500 font-medium">A IA está reimaginando sua imagem...</p>
                            <p className="text-slate-400 text-sm mt-1">Isso pode levar alguns segundos.</p>
                        </div>
                    ) : generatedImage ? (
                        <img src={generatedImage} alt="Generated" className="w-full h-full object-contain" />
                    ) : (
                        <div className="text-center p-8 opacity-50">
                            <Wand2 size={64} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500">O resultado aparecerá aqui.</p>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={downloadImage}
                        disabled={!generatedImage}
                        className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-2 border transition-colors ${
                            generatedImage 
                            ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700' 
                            : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                        }`}
                    >
                        <Download size={18} /> Baixar
                    </button>
                    <button
                         onClick={() => {setGeneratedImage(null); setPrompt('');}}
                         disabled={!generatedImage}
                         className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-2 border transition-colors ${
                            generatedImage 
                            ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700' 
                            : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                        }`}
                    >
                        <RefreshCw size={18} /> Novo Teste
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AIImageEditor;

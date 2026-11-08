import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.6';
env.allowLocalModels = false;
let generator;
self.onmessage=async ({data})=>{
  try {
    if(!generator){
      generator=await pipeline('text-generation','onnx-community/Qwen2.5-0.5B-Instruct',{
        dtype:'q4',device:'wasm',progress_callback:p=>{
          if(p.status==='progress' && typeof p.progress==='number') self.postMessage({type:'progress',text:'Descargando el modelo: '+Math.round(p.progress)+' % del archivo actual. La primera vez puede tardar varios minutos.'});
          else if(p.status==='initiate')self.postMessage({type:'progress',text:'Descargando los archivos de MAM. La primera vez puede tardar varios minutos…'});
        }
      });
      self.postMessage({type:'ready'});
    }
    self.postMessage({type:'progress',text:'MAM está pensando…'});
    const messages=[{role:'system',content:'Eres MAM, un asistente amable y útil. Responde en el idioma del usuario, de forma clara y breve. No inventes datos; di cuando no sabes algo.'},...data.history];
    const result=await generator(messages,{max_new_tokens:180,do_sample:false});
    const text=result?.[0]?.generated_text?.at(-1)?.content;
    if(!text)throw new Error('La respuesta estaba vacía.');
    self.postMessage({type:'answer',text:String(text)});
  }catch(e){self.postMessage({type:'error',text:e?.message||'Error desconocido.'})}
};

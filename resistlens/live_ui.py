"""Session-scoped AI configuration; credentials never enter exported records."""
import json
from io import BytesIO
from zipfile import ZipFile, ZIP_DEFLATED
import pandas as pd
import streamlit as st
from .extraction import OpenAIAdapter, ExtractionError
from .benchmark import ROOT, load_manifest, run_samples

def live_adapter():
    key=st.session_state.get('live_key')
    model=st.session_state.get('live_model')
    # Do not expose a host-wide API credential to unauthenticated public visitors.
    if not key or not model:
        raise ExtractionError('Open AI connection and save your own API key and model for this session first.')
    return OpenAIAdapter(api_key=key,model=model)

def connection_page():
    st.subheader('AI connection')
    st.write('Connect an existing image-capable OpenAI model. This uses the model as supplied by its provider; it does not train or fine-tune it.')
    st.info('Your key is sent to this app server for API requests, kept in this session, and excluded from exports. Use only your trusted local or HTTPS deployment. API calls may incur charges.')
    with st.form('ai_connection',clear_on_submit=True):
        key=st.text_input('OpenAI API key',type='password',autocomplete='off')
        model=st.text_input('Model ID',placeholder='Enter the image-capable model available in your API account')
        save=st.form_submit_button('Save connection for this session',type='primary')
    if save:
        if not key.strip() or not model.strip():
            st.error('Both fields are required. No request was sent.')
        else:
            st.session_state.live_key=key.strip()
            st.session_state.live_model=model.strip()
            st.session_state.pop('vision_report',None)
            st.success('Connection saved, not yet tested. Open Vision benchmark and run one selected image to verify model access.')
    if st.session_state.get('live_key'):
        st.caption('Session model: '+st.session_state.get('live_model',''))
        if st.button('Forget my API key'):
            st.session_state.pop('live_key',None)
            st.session_state.pop('live_model',None)
            st.rerun()

def benchmark_page():
    st.subheader('Vision benchmark · 48 synthetic document images')
    st.write('Twelve independent source records, three layouts, and four imaging conditions. Development and test sets have different source records. No model has been trained on these files.')
    samples=load_manifest()
    split=st.selectbox('Dataset split',['development','test'])
    selected=[s for s in samples if s['split']==split]
    ids=st.multiselect('Images to evaluate (each selected image makes one API call)',[s['sample_id'] for s in selected],default=[selected[0]['sample_id']])
    preview_id=st.selectbox('Preview image',[s['sample_id'] for s in selected])
    sample=next(s for s in selected if s['sample_id']==preview_id)
    with st.expander('Image and expected labels',expanded=False):
        st.image(str(ROOT/sample['image']),width=600)
        st.json(sample['truth'])
    st.caption('Use development images to improve extraction. Reserve test images for the final evaluation; repeated tuning on test results makes them development data.')
    consent=st.checkbox('I authorize the selected synthetic images to be sent to OpenAI and understand that API charges may apply.')
    configured=bool(st.session_state.get('live_key') and st.session_state.get('live_model'))
    if not configured:
        st.info('Configure AI connection first. Dataset previews and downloads work without a key.')
    if st.button('Run real VLM evaluation',type='primary',disabled=not(configured and consent and ids)):
        progress=st.progress(0,text='Starting real API evaluation…')
        chosen=[s for s in selected if s['sample_id'] in ids]
        report=run_samples(chosen,live_adapter(),on_progress=lambda done,total:progress.progress(done/total,text=f'Processed {done} of {total}'))
        st.session_state.vision_report=report
    report=st.session_state.get('vision_report')
    if report:
        st.caption('Latest actual run: '+report['created_at']+' · model '+str(report['model']))
        a,b,c=st.columns(3)
        a.metric('Field accuracy',f"{report['field_accuracy']:.1%}")
        st.metric('Non-null field accuracy', f"{report['non_null_field_accuracy']:.1%}" if report.get('non_null_field_accuracy') is not None else 'Not measured')
        b.metric('Failed extractions',report['failures'])
        c.metric('Unsupported populated fields',report['unsupported_populations'])
        st.dataframe(pd.DataFrame([{'condition':k,**v} for k,v in report['by_variant'].items()]),hide_index=True)
        st.download_button('Download live evaluation results',json.dumps(report,indent=2),'vision-results.json','application/json')
        with st.expander('Inspect individual errors and extracted evidence'):
            st.json(report['results'])
        st.caption(report['scope'])
    out=BytesIO()
    with ZipFile(out,'w',ZIP_DEFLATED) as z:
        z.write(ROOT/'manifest.json','manifest.json')
        z.write(ROOT/'DATASET_CARD.md','DATASET_CARD.md')
        for s in samples:
            z.write(ROOT/s['image'],s['image'])
    st.download_button('Download all 48 images and labels',out.getvalue(),'resistlens-vision-benchmark.zip','application/zip')

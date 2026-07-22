# Vanilla JavaScript Usage

```html
<div id="panel" class="panel">
  <div class="panel-header">Panel</div>
  <div class="panel-body">Drag me.</div>
</div>

<script type="module">
  import { freedom } from '@blcklab/freedom'

  const element = document.querySelector('#panel')

  const win = freedom.window(element, {
    initialPosition: 'center',
    initialSize: { width: 420, height: 260 },
    dragHandle: '.panel-header',
    bounds: 'viewport'
  })

  window.panel = win
</script>
```

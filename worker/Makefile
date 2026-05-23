.PHONY: install run run-once check-deps

# Instalar dependencias Python
install:
	pip install -r requirements.txt

# Iniciar el worker en modo polling continuo
run:
	python src/main.py

# Procesar solo el siguiente job pendiente y salir
run-once:
	python src/main.py --once

# Verificar que las herramientas externas estén instaladas
check-deps:
	@echo "Verificando dependencias externas..."
	@command -v ns-train >/dev/null 2>&1 && echo "  ✓ nerfstudio (ns-train)" || echo "  ✗ nerfstudio NO encontrado → pip install nerfstudio"
	@command -v ns-process-data >/dev/null 2>&1 && echo "  ✓ ns-process-data" || echo "  ✗ ns-process-data NO encontrado"
	@command -v ns-export >/dev/null 2>&1 && echo "  ✓ ns-export" || echo "  ✗ ns-export NO encontrado"
	@command -v colmap >/dev/null 2>&1 && echo "  ✓ COLMAP" || echo "  ✗ COLMAP NO encontrado → brew install colmap"
	@python -c "import torch; print('  ✓ PyTorch', torch.__version__); mps=getattr(torch.backends,'mps',None); print('  MPS disponible:', mps.is_available() if mps else False)" 2>/dev/null || echo "  ✗ PyTorch NO encontrado"
	@python -c "import supabase; print('  ✓ supabase-py')" 2>/dev/null || echo "  ✗ supabase-py NO encontrado"
	@echo "Listo."

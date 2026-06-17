#!/usr/bin/env python3
"""
Tests unitarios para process_bounty.py
"""
import json
import tempfile
import os
import sys
from pathlib import Path

# Añadir el directorio scripts al path
sys.path.insert(0, str(Path(__file__).parent))

from process_bounty import validate_bounty, load_bounties, save_bounties

def test_validate_bounty_valid():
    """Test que un bounty válido pasa la validación."""
    bounty = {
        "id": 1505292,
        "category": "Memes",
        "winners": 2,
        "current_entries": 595,
        "max_entries": 1000,
        "duration_days": 5,
        "reward_per_winner": 18.9,
        "total_reward": 51481,
        "tags": ["recent@Memes", "top@Memes"],
        "bounty_types": ["OPEN_BOUNTY", "LOW_COMP", "SELF_POST_OPP"],
        "title": "Meme Bounty - Thanks to REUTERS",
        "status": "open",
        "detected_at": "2026-06-10T08:59:00Z",
        "source": "SN"
    }
    errors = validate_bounty(bounty)
    assert errors == [], f"Bounty válido no debería tener errores: {errors}"
    print("✓ test_validate_bounty_valid passed")

def test_validate_bounty_missing_fields():
    """Test que se detectan campos faltantes."""
    bounty = {
        "id": 1505292,
        "category": "Memes"
        # Faltan muchos campos requeridos
    }
    errors = validate_bounty(bounty)
    assert len(errors) > 0, "Debería haber errores por campos faltantes"
    assert any("winners" in e for e in errors), "Debería detectar 'winners' faltante"
    print("✓ test_validate_bounty_missing_fields passed")

def test_validate_bounty_invalid_winners():
    """Test que se detecta winners inválido."""
    bounty = {
        "id": 1505292,
        "category": "Memes",
        "winners": 0,  # Inválido
        "current_entries": 595,
        "max_entries": 1000,
        "duration_days": 5,
        "reward_per_winner": 18.9,
        "total_reward": 51481,
        "tags": ["recent@Memes"],
        "bounty_types": ["OPEN_BOUNTY"],
        "title": "Test",
        "status": "open",
        "detected_at": "2026-06-10T08:59:00Z",
        "source": "SN"
    }
    errors = validate_bounty(bounty)
    assert any("ganadores" in e.lower() for e in errors), "Debería detectar winners inválido"
    print("✓ test_validate_bounty_invalid_winners passed")

def test_validate_bounty_entries_exceed_max():
    """Test que se detecta cuando current_entries > max_entries."""
    bounty = {
        "id": 1505292,
        "category": "Memes",
        "winners": 2,
        "current_entries": 1500,  # Excede max_entries
        "max_entries": 1000,
        "duration_days": 5,
        "reward_per_winner": 18.9,
        "total_reward": 51481,
        "tags": ["recent@Memes"],
        "bounty_types": ["OPEN_BOUNTY"],
        "title": "Test",
        "status": "open",
        "detected_at": "2026-06-10T08:59:00Z",
        "source": "SN"
    }
    errors = validate_bounty(bounty)
    assert any("exceder" in e.lower() for e in errors), "Debería detectar entries > max"
    print("✓ test_validate_bounty_entries_exceed_max passed")

def test_validate_bounty_invalid_status():
    """Test que se detecta status inválido."""
    bounty = {
        "id": 1505292,
        "category": "Memes",
        "winners": 2,
        "current_entries": 595,
        "max_entries": 1000,
        "duration_days": 5,
        "reward_per_winner": 18.9,
        "total_reward": 51481,
        "tags": ["recent@Memes"],
        "bounty_types": ["OPEN_BOUNTY"],
        "title": "Test",
        "status": "invalid_status",  # Inválido
        "detected_at": "2026-06-10T08:59:00Z",
        "source": "SN"
    }
    errors = validate_bounty(bounty)
    assert any("estado" in e.lower() for e in errors), "Debería detectar status inválido"
    print("✓ test_validate_bounty_invalid_status passed")

def test_load_save_bounties():
    """Test de carga y guardado de bounties."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        temp_file = f.name
    
    try:
        # Monkey patch del archivo
        import process_bounty
        original_file = process_bounty.BOUNTIES_FILE
        process_bounty.BOUNTIES_FILE = Path(temp_file)
        
        # Guardar datos de prueba
        test_data = {"bounties": [{"id": 1, "title": "Test"}]}
        save_bounties(test_data)
        
        # Cargar y verificar
        loaded = load_bounties()
        assert loaded == test_data, "Los datos cargados deben coincidir con los guardados"
        
        print("✓ test_load_save_bounties passed")
    finally:
        process_bounty.BOUNTIES_FILE = original_file
        if os.path.exists(temp_file):
            os.unlink(temp_file)

def run_all_tests():
    """Ejecuta todos los tests."""
    test_validate_bounty_valid()
    test_validate_bounty_missing_fields()
    test_validate_bounty_invalid_winners()
    test_validate_bounty_entries_exceed_max()
    test_validate_bounty_invalid_status()
    test_load_save_bounties()
    print("\n✓ Todos los tests pasaron")

if __name__ == "__main__":
    run_all_tests()

import { Component } from '@angular/core';

type EtapaProcesso = 'pre-triagem' | 'triagem' | 'coleta';

@Component({
  selector: 'app-lista-processo-doacao',
  standalone: true,
  imports: [],
  templateUrl: './lista-processo-doacao.component.html',
  styleUrl: './lista-processo-doacao.component.scss'
})
export class ListaProcessoDoacaoComponent {
  abaAtiva: EtapaProcesso = 'pre-triagem';

  selecionarAba(aba: EtapaProcesso): void {
    if (this.abaAtiva === aba) return; // Evita renderizações desnecessárias
    this.abaAtiva = aba;
    
    // Aqui você pode acionar serviços para buscar os dados específicos da aba,
    // ou deixar que os componentes filhos façam isso no próprio ngOnInit deles.
  }
}

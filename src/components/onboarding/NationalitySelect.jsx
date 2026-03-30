import React, { useState } from 'react';
import { Search } from 'lucide-react';

const NATIONALITIES = [
  { code: 'AF', flag: '🇦🇫', name: 'Afghan' },
  { code: 'AL', flag: '🇦🇱', name: 'Albanian' },
  { code: 'DZ', flag: '🇩🇿', name: 'Algerian' },
  { code: 'AD', flag: '🇦🇩', name: 'Andorran' },
  { code: 'AO', flag: '🇦🇴', name: 'Angolan' },
  { code: 'AR', flag: '🇦🇷', name: 'Argentine' },
  { code: 'AM', flag: '🇦🇲', name: 'Armenian' },
  { code: 'AU', flag: '🇦🇺', name: 'Australian' },
  { code: 'AT', flag: '🇦🇹', name: 'Austrian' },
  { code: 'AZ', flag: '🇦🇿', name: 'Azerbaijani' },
  { code: 'BS', flag: '🇧🇸', name: 'Bahamian' },
  { code: 'BH', flag: '🇧🇭', name: 'Bahraini' },
  { code: 'BD', flag: '🇧🇩', name: 'Bangladeshi' },
  { code: 'BY', flag: '🇧🇾', name: 'Belarusian' },
  { code: 'BE', flag: '🇧🇪', name: 'Belgian' },
  { code: 'BZ', flag: '🇧🇿', name: 'Belizean' },
  { code: 'BJ', flag: '🇧🇯', name: 'Beninese' },
  { code: 'BO', flag: '🇧🇴', name: 'Bolivian' },
  { code: 'BA', flag: '🇧🇦', name: 'Bosnian' },
  { code: 'BW', flag: '🇧🇼', name: 'Botswanan' },
  { code: 'BR', flag: '🇧🇷', name: 'Brazilian' },
  { code: 'BN', flag: '🇧🇳', name: 'Bruneian' },
  { code: 'BG', flag: '🇧🇬', name: 'Bulgarian' },
  { code: 'BF', flag: '🇧🇫', name: 'Burkinabe' },
  { code: 'BI', flag: '🇧🇮', name: 'Burundian' },
  { code: 'KH', flag: '🇰🇭', name: 'Cambodian' },
  { code: 'CM', flag: '🇨🇲', name: 'Cameroonian' },
  { code: 'CA', flag: '🇨🇦', name: 'Canadian' },
  { code: 'CV', flag: '🇨🇻', name: 'Cape Verdean' },
  { code: 'CF', flag: '🇨🇫', name: 'Central African' },
  { code: 'TD', flag: '🇹🇩', name: 'Chadian' },
  { code: 'CL', flag: '🇨🇱', name: 'Chilean' },
  { code: 'CN', flag: '🇨🇳', name: 'Chinese' },
  { code: 'CO', flag: '🇨🇴', name: 'Colombian' },
  { code: 'KM', flag: '🇰🇲', name: 'Comorian' },
  { code: 'CG', flag: '🇨🇬', name: 'Congolese' },
  { code: 'CR', flag: '🇨🇷', name: 'Costa Rican' },
  { code: 'HR', flag: '🇭🇷', name: 'Croatian' },
  { code: 'CU', flag: '🇨🇺', name: 'Cuban' },
  { code: 'CY', flag: '🇨🇾', name: 'Cypriot' },
  { code: 'CZ', flag: '🇨🇿', name: 'Czech' },
  { code: 'DK', flag: '🇩🇰', name: 'Danish' },
  { code: 'DJ', flag: '🇩🇯', name: 'Djiboutian' },
  { code: 'DO', flag: '🇩🇴', name: 'Dominican' },
  { code: 'EC', flag: '🇪🇨', name: 'Ecuadorian' },
  { code: 'EG', flag: '🇪🇬', name: 'Egyptian' },
  { code: 'SV', flag: '🇸🇻', name: 'Salvadoran' },
  { code: 'GQ', flag: '🇬🇶', name: 'Equatorial Guinean' },
  { code: 'ER', flag: '🇪🇷', name: 'Eritrean' },
  { code: 'EE', flag: '🇪🇪', name: 'Estonian' },
  { code: 'ET', flag: '🇪🇹', name: 'Ethiopian' },
  { code: 'FJ', flag: '🇫🇯', name: 'Fijian' },
  { code: 'FI', flag: '🇫🇮', name: 'Finnish' },
  { code: 'FR', flag: '🇫🇷', name: 'French' },
  { code: 'GA', flag: '🇬🇦', name: 'Gabonese' },
  { code: 'GM', flag: '🇬🇲', name: 'Gambian' },
  { code: 'GE', flag: '🇬🇪', name: 'Georgian' },
  { code: 'DE', flag: '🇩🇪', name: 'German' },
  { code: 'GH', flag: '🇬🇭', name: 'Ghanaian' },
  { code: 'GR', flag: '🇬🇷', name: 'Greek' },
  { code: 'GT', flag: '🇬🇹', name: 'Guatemalan' },
  { code: 'GN', flag: '🇬🇳', name: 'Guinean' },
  { code: 'GW', flag: '🇬🇼', name: 'Guinea-Bissauan' },
  { code: 'GY', flag: '🇬🇾', name: 'Guyanese' },
  { code: 'HT', flag: '🇭🇹', name: 'Haitian' },
  { code: 'HN', flag: '🇭🇳', name: 'Honduran' },
  { code: 'HU', flag: '🇭🇺', name: 'Hungarian' },
  { code: 'IS', flag: '🇮🇸', name: 'Icelandic' },
  { code: 'IN', flag: '🇮🇳', name: 'Indian' },
  { code: 'ID', flag: '🇮🇩', name: 'Indonesian' },
  { code: 'IR', flag: '🇮🇷', name: 'Iranian' },
  { code: 'IQ', flag: '🇮🇶', name: 'Iraqi' },
  { code: 'IE', flag: '🇮🇪', name: 'Irish' },
  { code: 'IL', flag: '🇮🇱', name: 'Israeli' },
  { code: 'IT', flag: '🇮🇹', name: 'Italian' },
  { code: 'JM', flag: '🇯🇲', name: 'Jamaican' },
  { code: 'JP', flag: '🇯🇵', name: 'Japanese' },
  { code: 'JO', flag: '🇯🇴', name: 'Jordanian' },
  { code: 'KZ', flag: '🇰🇿', name: 'Kazakhstani' },
  { code: 'KE', flag: '🇰🇪', name: 'Kenyan' },
  { code: 'KW', flag: '🇰🇼', name: 'Kuwaiti' },
  { code: 'KG', flag: '🇰🇬', name: 'Kyrgyz' },
  { code: 'LA', flag: '🇱🇦', name: 'Laotian' },
  { code: 'LV', flag: '🇱🇻', name: 'Latvian' },
  { code: 'LB', flag: '🇱🇧', name: 'Lebanese' },
  { code: 'LS', flag: '🇱🇸', name: 'Lesothan' },
  { code: 'LR', flag: '🇱🇷', name: 'Liberian' },
  { code: 'LY', flag: '🇱🇾', name: 'Libyan' },
  { code: 'LI', flag: '🇱🇮', name: 'Liechtensteiner' },
  { code: 'LT', flag: '🇱🇹', name: 'Lithuanian' },
  { code: 'LU', flag: '🇱🇺', name: 'Luxembourgish' },
  { code: 'MG', flag: '🇲🇬', name: 'Malagasy' },
  { code: 'MW', flag: '🇲🇼', name: 'Malawian' },
  { code: 'MY', flag: '🇲🇾', name: 'Malaysian' },
  { code: 'MV', flag: '🇲🇻', name: 'Maldivian' },
  { code: 'ML', flag: '🇲🇱', name: 'Malian' },
  { code: 'MT', flag: '🇲🇹', name: 'Maltese' },
  { code: 'MR', flag: '🇲🇷', name: 'Mauritanian' },
  { code: 'MU', flag: '🇲🇺', name: 'Mauritian' },
  { code: 'MX', flag: '🇲🇽', name: 'Mexican' },
  { code: 'MD', flag: '🇲🇩', name: 'Moldovan' },
  { code: 'MC', flag: '🇲🇨', name: 'Monegasque' },
  { code: 'MN', flag: '🇲🇳', name: 'Mongolian' },
  { code: 'ME', flag: '🇲🇪', name: 'Montenegrin' },
  { code: 'MA', flag: '🇲🇦', name: 'Moroccan' },
  { code: 'MZ', flag: '🇲🇿', name: 'Mozambican' },
  { code: 'MM', flag: '🇲🇲', name: 'Myanmar' },
  { code: 'NA', flag: '🇳🇦', name: 'Namibian' },
  { code: 'NP', flag: '🇳🇵', name: 'Nepalese' },
  { code: 'NL', flag: '🇳🇱', name: 'Dutch' },
  { code: 'NZ', flag: '🇳🇿', name: 'New Zealander' },
  { code: 'NI', flag: '🇳🇮', name: 'Nicaraguan' },
  { code: 'NE', flag: '🇳🇪', name: 'Nigerien' },
  { code: 'NG', flag: '🇳🇬', name: 'Nigerian' },
  { code: 'NO', flag: '🇳🇴', name: 'Norwegian' },
  { code: 'OM', flag: '🇴🇲', name: 'Omani' },
  { code: 'PK', flag: '🇵🇰', name: 'Pakistani' },
  { code: 'PA', flag: '🇵🇦', name: 'Panamanian' },
  { code: 'PG', flag: '🇵🇬', name: 'Papua New Guinean' },
  { code: 'PY', flag: '🇵🇾', name: 'Paraguayan' },
  { code: 'PE', flag: '🇵🇪', name: 'Peruvian' },
  { code: 'PH', flag: '🇵🇭', name: 'Filipino' },
  { code: 'PL', flag: '🇵🇱', name: 'Polish' },
  { code: 'PT', flag: '🇵🇹', name: 'Portuguese' },
  { code: 'QA', flag: '🇶🇦', name: 'Qatari' },
  { code: 'RO', flag: '🇷🇴', name: 'Romanian' },
  { code: 'RU', flag: '🇷🇺', name: 'Russian' },
  { code: 'RW', flag: '🇷🇼', name: 'Rwandan' },
  { code: 'SA', flag: '🇸🇦', name: 'Saudi Arabian' },
  { code: 'SN', flag: '🇸🇳', name: 'Senegalese' },
  { code: 'RS', flag: '🇷🇸', name: 'Serbian' },
  { code: 'SL', flag: '🇸🇱', name: 'Sierra Leonean' },
  { code: 'SG', flag: '🇸🇬', name: 'Singaporean' },
  { code: 'SK', flag: '🇸🇰', name: 'Slovak' },
  { code: 'SI', flag: '🇸🇮', name: 'Slovenian' },
  { code: 'SO', flag: '🇸🇴', name: 'Somali' },
  { code: 'ZA', flag: '🇿🇦', name: 'South African' },
  { code: 'KR', flag: '🇰🇷', name: 'South Korean' },
  { code: 'SS', flag: '🇸🇸', name: 'South Sudanese' },
  { code: 'ES', flag: '🇪🇸', name: 'Spanish' },
  { code: 'LK', flag: '🇱🇰', name: 'Sri Lankan' },
  { code: 'SD', flag: '🇸🇩', name: 'Sudanese' },
  { code: 'SR', flag: '🇸🇷', name: 'Surinamese' },
  { code: 'SE', flag: '🇸🇪', name: 'Swedish' },
  { code: 'CH', flag: '🇨🇭', name: 'Swiss' },
  { code: 'SY', flag: '🇸🇾', name: 'Syrian' },
  { code: 'TW', flag: '🇹🇼', name: 'Taiwanese' },
  { code: 'TJ', flag: '🇹🇯', name: 'Tajik' },
  { code: 'TZ', flag: '🇹🇿', name: 'Tanzanian' },
  { code: 'TH', flag: '🇹🇭', name: 'Thai' },
  { code: 'TL', flag: '🇹🇱', name: 'Timorese' },
  { code: 'TG', flag: '🇹🇬', name: 'Togolese' },
  { code: 'TT', flag: '🇹🇹', name: 'Trinidadian' },
  { code: 'TN', flag: '🇹🇳', name: 'Tunisian' },
  { code: 'TR', flag: '🇹🇷', name: 'Turkish' },
  { code: 'TM', flag: '🇹🇲', name: 'Turkmen' },
  { code: 'UG', flag: '🇺🇬', name: 'Ugandan' },
  { code: 'UA', flag: '🇺🇦', name: 'Ukrainian' },
  { code: 'AE', flag: '🇦🇪', name: 'Emirati' },
  { code: 'GB', flag: '🇬🇧', name: 'British' },
  { code: 'US', flag: '🇺🇸', name: 'American' },
  { code: 'UY', flag: '🇺🇾', name: 'Uruguayan' },
  { code: 'UZ', flag: '🇺🇿', name: 'Uzbek' },
  { code: 'VE', flag: '🇻🇪', name: 'Venezuelan' },
  { code: 'VN', flag: '🇻🇳', name: 'Vietnamese' },
  { code: 'YE', flag: '🇾🇪', name: 'Yemeni' },
  { code: 'ZM', flag: '🇿🇲', name: 'Zambian' },
  { code: 'ZW', flag: '🇿🇼', name: 'Zimbabwean' },
].sort((a, b) => a.name.localeCompare(b.name));

export { NATIONALITIES };

export default function NationalitySelect({ selected, onSelect }) {
  const [search, setSearch] = useState('');

  const filtered = NATIONALITIES.filter(n =>
    n.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedNationality = NATIONALITIES.find(n => n.code === selected);
  const isDark = !document.documentElement.classList.contains('light');
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">What's your nationality? 🌍</h2>
        <p className="text-gray-400">Optional — helps you connect with people from similar backgrounds.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search nationality..."
          className={`full border border-gray-700 rounded-2xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00fea3] transition-colors ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        />
      </div>

      {/* Selected badge */}
      {selectedNationality && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#00fea3]/10 border border-[#00fea3]/40 w-fit">
          <span className="text-xl">{selectedNationality.flag}</span>
          <span className="text-[#00fea3] font-semibold text-sm">{selectedNationality.name}</span>
          <button
            onClick={() => onSelect('')}
            className="ml-1 text-[#00fea3]/60 hover:text-[#00fea3] text-xs"
          >✕</button>
        </div>
      )}

      {/* List */}
      <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
        {filtered.map(n => (
          <button
            key={n.code}
            onClick={() => onSelect(n.code)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
              selected === n.code
                ? 'bg-[#00fea3]/10 border border-[#00fea3]/40'
                : isDark
                  ? 'bg-gray-900/60 border border-transparent hover:border-gray-700'
                  : 'bg-white border border-gray-200 hover:border-gray-400'
            }`}
          >
            <span className="text-2xl">{n.flag}</span>
            <span className={`font-medium text-sm ${selected === n.code ? 'text-[#00fea3]' : isDark ? 'text-white' : 'text-gray-800'}`}>
              {n.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
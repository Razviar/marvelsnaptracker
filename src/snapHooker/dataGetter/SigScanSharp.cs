using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Runtime.InteropServices;

namespace DataGetter
{
    public class SigScanSharp
    {
        private IntPtr g_hProcess { get; set; }

        private byte[] g_arrModuleBuffer { get; set; }

        private ulong g_lpModuleBase { get; set; }

        private Dictionary<string, string> g_dictStringPatterns { get; }

        public SigScanSharp(IntPtr hProc)
        {
            g_hProcess = hProc;
            g_dictStringPatterns = new Dictionary<string, string>();
        }

        public bool SelectModule(ProcessModule targetModule)
        {
            g_lpModuleBase = (ulong)(long)targetModule.BaseAddress;
            g_arrModuleBuffer = new byte[targetModule.ModuleMemorySize];
            g_dictStringPatterns.Clear();
            return Win32.ReadProcessMemory(g_hProcess, g_lpModuleBase, g_arrModuleBuffer, targetModule.ModuleMemorySize);
        }

        public void AddPattern(string szPatternName, string szPattern) => g_dictStringPatterns.Add(szPatternName, szPattern);

        private bool PatternCheck(int nOffset, byte[] arrPattern)
        {
            for (int index = 0; index < arrPattern.Length; ++index)
            {
                if (arrPattern[index] != 0 && arrPattern[index] != g_arrModuleBuffer[nOffset + index])
                    return false;
            }
            return true;
        }

        public ulong FindPattern(string szPattern, out long lTime)
        {
            if (g_arrModuleBuffer == null || g_lpModuleBase == 0UL)
                throw new Exception("Selected module is null");
            Stopwatch stopwatch = Stopwatch.StartNew();
            byte[] patternString = ParsePatternString(szPattern);
            for (int nOffset = 0; nOffset < g_arrModuleBuffer.Length; ++nOffset)
            {
                if (g_arrModuleBuffer[nOffset] == patternString[0] && PatternCheck(nOffset, patternString))
                {
                    lTime = stopwatch.ElapsedMilliseconds;
                    return g_lpModuleBase + (ulong)nOffset;
                }
            }
            lTime = stopwatch.ElapsedMilliseconds;
            return 0;
        }

        public Dictionary<string, ulong> FindPatterns(out long lTime)
        {
            if (g_arrModuleBuffer == null || g_lpModuleBase == 0UL)
                throw new Exception("Selected module is null");
            Stopwatch stopwatch = Stopwatch.StartNew();
            byte[][] numArray1 = new byte[g_dictStringPatterns.Count][];
            ulong[] numArray2 = new ulong[g_dictStringPatterns.Count];
            KeyValuePair<string, string> keyValuePair;
            for (int index1 = 0; index1 < g_dictStringPatterns.Count; ++index1)
            {
                byte[][] numArray3 = numArray1;
                int index2 = index1;
                keyValuePair = g_dictStringPatterns.ElementAt(index1);
                byte[] patternString = ParsePatternString(keyValuePair.Value);
                numArray3[index2] = patternString;
            }
            for (int nOffset = 0; nOffset < g_arrModuleBuffer.Length; ++nOffset)
            {
                for (int index = 0; index < numArray1.Length; ++index)
                {
                    if (numArray2[index] == 0UL && PatternCheck(nOffset, numArray1[index]))
                        numArray2[index] = g_lpModuleBase + (ulong)nOffset;
                }
            }
            Dictionary<string, ulong> patterns = new Dictionary<string, ulong>();
            for (int index = 0; index < numArray1.Length; ++index)
            {
                Dictionary<string, ulong> dictionary = patterns;
                keyValuePair = g_dictStringPatterns.ElementAt(index);
                string key = keyValuePair.Key;
                long num = (long)numArray2[index];
                dictionary[key] = (ulong)num;
            }
            lTime = stopwatch.ElapsedMilliseconds;
            return patterns;
        }

        private byte[] ParsePatternString(string szPattern)
        {
            List<byte> byteList = new List<byte>();
            string str1 = szPattern;
            char[] chArray = new char[1] { ' ' };
            foreach (string str2 in str1.Split(chArray))
                byteList.Add(str2 == "?" ? (byte)0 : Convert.ToByte(str2, 16));
            return byteList.ToArray();
        }

        public static class Win32
        {
            [DllImport("kernel32.dll")]
            public static extern bool ReadProcessMemory(
              IntPtr hProcess,
              ulong lpBaseAddress,
              byte[] lpBuffer,
              int dwSize,
              int lpNumberOfBytesRead = 0);
        }
    }
}

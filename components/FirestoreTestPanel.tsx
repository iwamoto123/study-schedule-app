/* =====================================================================
 * Firestore Test Panel - サービスクラスのテスト用コンポーネント
 * ===================================================================== */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { firestoreService } from '@/lib/firestoreService';

export default function FirestoreTestPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setResults([]);
  };

  /* ------------------------------------------------------------------ */
  /*                           テスト実行関数                           */
  /* ------------------------------------------------------------------ */
  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    if (isLoading) return;

    setIsLoading(true);
    addResult(`🧪 Starting ${testName}...`);

    try {
      await testFn();
      addResult(`✅ ${testName} completed successfully`);
    } catch (error) {
      addResult(`❌ ${testName} failed: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`${testName} error:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*                           個別テスト関数                           */
  /* ------------------------------------------------------------------ */
  const testBasicRead = () => runTest('Basic Read Test', () => firestoreService.testBasicRead());

  const testBasicWrite = () => runTest('Basic Write Test', async () => {
    const docId = await firestoreService.testBasicWrite();
    addResult(`📝 Document created with ID: ${docId}`);
  });

  const testTodosRead = () => runTest('Todos Read Test', () => firestoreService.testTodosRead());

  const testRealtimeListener = () => runTest('Realtime Listener Test', async () => {
    const unsubscribe = await firestoreService.testRealtimeListener();
    addResult(`👂 Listener active (will auto-stop in 5 seconds)`);

    // 5秒後に自動停止
    setTimeout(() => {
      unsubscribe();
      addResult(`🔇 Listener stopped`);
    }, 5000);
  });

  const runAllTests = () => runTest('All Tests', () => firestoreService.runAllTests());

  const testWithoutAuth = () => runTest('No Auth Test', () => firestoreService.testWithoutAuth());

  /* ------------------------------------------------------------------ */
  /*                           UI                                      */
  /* ------------------------------------------------------------------ */
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">🧪 Firestore Service Test Panel</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* テストボタン */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <Button
            onClick={testWithoutAuth}
            disabled={isLoading}
            variant="default"
            className="bg-green-600 hover:bg-green-700"
          >
            🔓 No Auth Test
          </Button>

          <Button
            onClick={testBasicRead}
            disabled={isLoading}
            variant="outline"
          >
            📖 Basic Read
          </Button>

          <Button
            onClick={testBasicWrite}
            disabled={isLoading}
            variant="outline"
          >
            ✏️ Basic Write
          </Button>

          <Button
            onClick={testTodosRead}
            disabled={isLoading}
            variant="outline"
          >
            📋 Todos Read
          </Button>

          <Button
            onClick={testRealtimeListener}
            disabled={isLoading}
            variant="outline"
          >
            👂 Realtime
          </Button>

          <Button
            onClick={runAllTests}
            disabled={isLoading}
            className="md:col-span-2"
          >
            🧪 Run All Tests
          </Button>
        </div>

        {/* コントロールボタン */}
        <div className="flex justify-between">
          <Button
            onClick={clearResults}
            variant="secondary"
            size="sm"
          >
            🗑️ Clear Results
          </Button>

          {isLoading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-600">Testing...</span>
            </div>
          )}
        </div>

        {/* 結果表示 */}
        <div className="border rounded-lg p-4 bg-gray-50 min-h-[200px] max-h-[400px] overflow-y-auto">
          <h3 className="font-semibold mb-2">Test Results:</h3>

          {results.length === 0 ? (
            <p className="text-gray-500 italic">No tests run yet. Click a button above to start testing.</p>
          ) : (
            <div className="space-y-1">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`text-sm font-mono ${
                    result.includes('✅') ? 'text-green-600' :
                    result.includes('❌') ? 'text-red-600' :
                    result.includes('🧪') ? 'text-blue-600' :
                    'text-gray-700'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 使用方法 */}
        <div className="border rounded-lg p-3 bg-blue-50">
          <h4 className="font-medium text-blue-800 mb-1">使用方法:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 各ボタンをクリックして個別のFirestore操作をテスト</li>
            <li>• &quot;Run All Tests&quot; ですべてのテストを順番に実行</li>
            <li>• コンソール（F12）でより詳細なログを確認</li>
            <li>• 権限エラーが発生する場合は、認証状態とFirestore Rulesを確認</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}